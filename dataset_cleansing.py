import re
from pathlib import Path
from html.parser import HTMLParser

# Configuration
MAX_ROWS_PER_CHUNK = 20  # Maximum number of rows per table chunk before splitting with repeated headers
MAX_H2_CHARS = 2000  # Maximum characters per H2 section before splitting into parts

class TableParser(HTMLParser):
    """Parse HTML table and extract cell data with rowspan/colspan information."""
    
    def __init__(self):
        super().__init__()
        self.rows = []
        self.current_row = []
        self.current_cell = ''
        self.in_table = False
        self.in_td = False
        self.current_rowspan = 1
        self.current_colspan = 1
        
    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
            self.rows = []
        elif tag == 'tr' and self.in_table:
            self.current_row = []
        elif tag == 'td' and self.in_table:
            self.in_td = True
            self.current_cell = ''
            self.current_rowspan = 1
            self.current_colspan = 1
            # Get rowspan and colspan attributes
            for attr, value in attrs:
                if attr == 'rowspan':
                    self.current_rowspan = int(value)
                elif attr == 'colspan':
                    self.current_colspan = int(value)
    
    def handle_endtag(self, tag):
        if tag == 'table':
            self.in_table = False
        elif tag == 'tr' and self.in_table:
            if self.current_row:
                self.rows.append(self.current_row)
        elif tag == 'td' and self.in_td:
            self.in_td = False
            # Store cell with its span information
            self.current_row.append({
                'content': self.current_cell.strip(),
                'rowspan': self.current_rowspan,
                'colspan': self.current_colspan
            })
    
    def handle_data(self, data):
        if self.in_td:
            # Replace newlines with space to keep content on single line for Markdown tables
            cleaned_data = ' '.join(data.split())
            if cleaned_data:  # Only add if there's actual content after cleaning
                if self.current_cell:  # Add space if we already have content
                    self.current_cell += ' '
                self.current_cell += cleaned_data

def html_table_to_markdown(html_table):
    """
    Convert HTML table to Markdown format.
    Handle rowspan and colspan by filling merged cells with parent value.
    Take first row as header, combining split cells if header has rowspan.
    Split tables when rows span all columns (section headers).
    """
    parser = TableParser()
    parser.feed(html_table)
    
    if not parser.rows:
        return html_table  # Return original if parsing failed
    
    # Create a grid to handle rowspan/colspan
    # First, determine the actual grid size
    max_cols = 0
    for row in parser.rows:
        col_count = sum(cell['colspan'] for cell in row)
        max_cols = max(max_cols, col_count)
    
    # Check if first row is a table caption (spans all columns)
    table_caption = None
    has_caption = False
    if parser.rows and len(parser.rows[0]) == 1 and parser.rows[0][0]['colspan'] == max_cols:
        table_caption = parser.rows[0][0]['content']
        has_caption = True
    
    # Work with rows excluding caption
    data_rows = parser.rows[1:] if has_caption else parser.rows
    
    # Create the grid with None values (for data rows only)
    grid = [[None for _ in range(max_cols)] for _ in range(len(data_rows))]
    
    # Track which rows are section headers (span all columns)
    section_header_rows = []
    
    # Fill the grid and identify section headers
    for row_idx, row in enumerate(data_rows):
        col_idx = 0
        
        # Check if this row is a section header (single cell spanning all columns)
        if len(row) == 1 and row[0]['colspan'] == max_cols:
            section_header_rows.append(row_idx)
        
        for cell in row:
            # Find the next empty cell in this row
            while col_idx < max_cols and grid[row_idx][col_idx] is not None:
                col_idx += 1
            
            if col_idx >= max_cols:
                break
            
            # Fill the cell and handle spans
            content = cell['content']
            rowspan = cell['rowspan']
            colspan = cell['colspan']
            
            for r in range(rowspan):
                for c in range(colspan):
                    if row_idx + r < len(grid) and col_idx + c < max_cols:
                        grid[row_idx + r][col_idx + c] = content
            
            col_idx += colspan
    
    # Helper function to detect if a row contains data-like patterns
    def is_data_row(row_cells):
        """Check if row cells contain patterns typical of data rather than headers"""
        if not row_cells:
            return False
        
        import re
        
        for cell in row_cells:
            content = cell['content'].strip()
            if not content:
                continue
            
            # Pattern 1: Starts with (a), (b), (i), (ii), etc. - labeled items
            if re.match(r'^\([a-z]+\)', content, re.IGNORECASE):
                return True
            
            # Pattern 2: Course codes (e.g., EE502, EIE3129, CSE40408)
            if re.match(r'^[A-Z]{2,5}\d{4,5}[A-Z]?$', content):
                return True
            
            # Pattern 3: Contains course code at start followed by space and title
            if re.match(r'^[A-Z]{2,5}\d{4,5}[A-Z]?\s+', content):
                return True
        
        return False
    
    # Determine header rows (based on data_rows, not original parser.rows)
    # Special case: if we extracted a caption AND there are section headers,
    # then there's no shared header - each section will use its own first row
    if has_caption and section_header_rows:
        header_rows = 0
    else:
        # Check if first row looks like data rather than a header
        first_row_cells = data_rows[0] if data_rows else []
        second_row_cells = data_rows[1] if len(data_rows) > 1 else []
        
        # If first row has data-like patterns, treat it as data (no header)
        if is_data_row(first_row_cells):
            # Verify by checking if second row also has similar patterns
            if is_data_row(second_row_cells):
                header_rows = 0
            else:
                # First row looks like data but second doesn't - might be a single-row header
                # Default to treating first row as header
                header_rows = 1
        else:
            # First row doesn't look like data - likely a header
            header_rows = 1
            
            # Check if any cell in first row has colspan > 1
            # AND there are cells in row 2 that appear to be sub-headers for those colspan cells
            has_colspan_in_first_row = any(cell['colspan'] > 1 for cell in first_row_cells)
            
            if has_colspan_in_first_row and len(data_rows) > 1:
                # Check if second row appears to be a sub-header row
                # It should have rowspan == 1 AND should NOT have the same colspan pattern as first row
                # (if it has the same pattern, it's likely a data row, not a sub-header)
                second_row_colspan_pattern = [cell['colspan'] for cell in second_row_cells]
                first_row_colspan_pattern = [cell['colspan'] for cell in first_row_cells]
                
                if (all(cell['rowspan'] == 1 for cell in second_row_cells) and 
                    second_row_colspan_pattern != first_row_colspan_pattern and
                    not is_data_row(second_row_cells)):
                    # This looks like a two-row header structure
                    header_rows = 2
    
    # Split tables at section header rows
    if section_header_rows:
        tables = []
        current_start = header_rows  # Start after the header rows
        
        for section_row_idx in section_header_rows:
            # Skip if section header is in the header rows
            if section_row_idx < header_rows:
                continue
            
            # Add table before this section header (only if there are data rows)
            if section_row_idx > current_start:
                table_data = {
                    'grid': grid,
                    'start_row': current_start,
                    'end_row': section_row_idx,
                    'max_cols': max_cols
                }
                tables.append(('table', table_data))
            
            # Add section header as text
            section_text = grid[section_row_idx][0] or ''
            tables.append(('section', section_text))
            
            current_start = section_row_idx + 1
        
        # Add remaining table after last section header
        if current_start < len(grid):
            table_data = {
                'grid': grid,
                'start_row': current_start,
                'end_row': len(grid),
                'max_cols': max_cols
            }
            tables.append(('table', table_data))
        
        # Build output for split tables
        markdown_parts = []
        
        # Add table caption if present
        if table_caption:
            markdown_parts.append(f"**{table_caption}**\n")
        
        # Determine shared header:
        # - If header_rows == 0, there's NO shared header (either caption exists or first row is data)
        # - Otherwise, the header is shared across all sub-tables
        shared_header = None
        if header_rows > 0:
            if header_rows > 1:
                shared_header = []
                for col_idx in range(max_cols):
                    combined_content = []
                    for row_idx in range(header_rows):
                        if row_idx == 0 or grid[row_idx][col_idx] != grid[row_idx - 1][col_idx]:
                            content = grid[row_idx][col_idx] or ''
                            if content:
                                combined_content.append(content)
                    shared_header.append(' '.join(combined_content))
            else:
                # Deduplicate consecutive values for single header row
                raw_header = [grid[0][col_idx] or '' for col_idx in range(max_cols)]
                shared_header = []
                prev_value = None
                for value in raw_header:
                    if value == prev_value and value != '':
                        shared_header.append('')
                    else:
                        shared_header.append(value)
                    prev_value = value
        
        for item_type, item_data in tables:
            if item_type == 'section':
                # Add section header as bold text
                markdown_parts.append(f"\n**{item_data}**\n")
            else:
                # Add table
                table_lines = []
                
                start_row = item_data['start_row']
                end_row = item_data['end_row']
                
                # Determine header for this sub-table
                if shared_header is not None:
                    # Use shared header
                    header = shared_header
                else:
                    # No shared header - need to check if first row of this sub-table is data or header
                    if start_row < end_row:
                        # Check if first row looks like data
                        first_row_cells = []
                        for col_idx in range(item_data['max_cols']):
                            content = item_data['grid'][start_row][col_idx] or ''
                            first_row_cells.append({'content': content, 'rowspan': 1, 'colspan': 1})
                        
                        if is_data_row(first_row_cells):
                            # First row is data - use empty header
                            header = [''] * item_data['max_cols']
                        else:
                            # First row is a header - extract it
                            raw_header = [item_data['grid'][start_row][col_idx] or '' for col_idx in range(item_data['max_cols'])]
                            # Deduplicate consecutive values (from colspan)
                            header = []
                            prev_value = None
                            for value in raw_header:
                                if value == prev_value and value != '':
                                    header.append('')
                                else:
                                    header.append(value)
                                prev_value = value
                            start_row += 1  # Skip this row when outputting data
                    else:
                        header = [''] * item_data['max_cols']
                
                table_lines.append('| ' + ' | '.join(header) + ' |')
                table_lines.append('| ' + ' | '.join(['---'] * item_data['max_cols']) + ' |')
                
                # Add data rows with deduplication
                # Split table if exceeds MAX_ROWS_PER_CHUNK rows OR MAX_H2_CHARS characters
                data_rows_range = list(range(start_row, end_row))
                
                # Smart chunking: split by row count or character count
                chunk_start_idx = 0
                while chunk_start_idx < len(data_rows_range):
                    # Start new chunk
                    if chunk_start_idx > 0:
                        table_lines.append('')  # Empty line for separation
                        table_lines.append('| ' + ' | '.join(header) + ' |')
                        table_lines.append('| ' + ' | '.join(['---'] * item_data['max_cols']) + ' |')
                    
                    # Calculate header size for this chunk
                    header_text = '| ' + ' | '.join(header) + ' |\n| ' + ' | '.join(['---'] * item_data['max_cols']) + ' |\n'
                    current_chunk_chars = len(header_text)
                    chunk_end_idx = chunk_start_idx
                    
                    # Add rows until we hit row limit or character limit
                    for idx in range(chunk_start_idx, min(chunk_start_idx + MAX_ROWS_PER_CHUNK, len(data_rows_range))):
                        row_idx = data_rows_range[idx]
                        raw_row = [item_data['grid'][row_idx][col_idx] or '' for col_idx in range(item_data['max_cols'])]
                        # Deduplicate consecutive values (from colspan)
                        row = []
                        prev_value = None
                        for value in raw_row:
                            if value == prev_value and value != '':
                                row.append('')
                            else:
                                row.append(value)
                            prev_value = value
                        
                        row_text = '| ' + ' | '.join(row) + ' |\n'
                        row_chars = len(row_text)
                        
                        # Check if adding this row would exceed character limit
                        if chunk_end_idx > chunk_start_idx and current_chunk_chars + row_chars > MAX_H2_CHARS:
                            # Would exceed limit, stop here
                            break
                        
                        # Check if single row exceeds limit (don't split in this case)
                        if chunk_end_idx == chunk_start_idx and row_chars > MAX_H2_CHARS:
                            # Single row is too large, include it anyway and move on
                            table_lines.append('| ' + ' | '.join(row) + ' |')
                            chunk_end_idx = idx + 1
                            break
                        
                        # Add the row
                        table_lines.append('| ' + ' | '.join(row) + ' |')
                        current_chunk_chars += row_chars
                        chunk_end_idx = idx + 1
                    
                    # Move to next chunk
                    chunk_start_idx = chunk_end_idx
                
                markdown_parts.append('\n'.join(table_lines))
        
        return '\n'.join(markdown_parts)
    
    # No section headers - build as single table
    markdown_lines = []
    
    # Add table caption if present
    if table_caption:
        markdown_lines.append(f"**{table_caption}**\n")
    
    # If header_rows == 0, create a generic header or treat all rows as data
    if header_rows == 0:
        # No header detected - create empty headers
        header = [''] * max_cols
        markdown_lines.append('| ' + ' | '.join(header) + ' |')
        markdown_lines.append('| ' + ' | '.join(['---'] * max_cols) + ' |')
        data_start_row = 0
    elif header_rows > 1:
        # Combine header cells vertically for cells that span multiple header rows
        header = []
        for col_idx in range(max_cols):
            combined_content = []
            for row_idx in range(header_rows):
                if row_idx == 0 or grid[row_idx][col_idx] != grid[row_idx - 1][col_idx]:
                    content = grid[row_idx][col_idx] or ''
                    if content:
                        combined_content.append(content)
            header.append(' '.join(combined_content))
        markdown_lines.append('| ' + ' | '.join(header) + ' |')
        markdown_lines.append('| ' + ' | '.join(['---'] * max_cols) + ' |')
        data_start_row = header_rows
    else:
        # Single header row
        header = [grid[0][col_idx] or '' for col_idx in range(max_cols)]
        markdown_lines.append('| ' + ' | '.join(header) + ' |')
        markdown_lines.append('| ' + ' | '.join(['---'] * max_cols) + ' |')
        data_start_row = header_rows
    
    # Data rows with chunking
    # Split table if exceeds MAX_ROWS_PER_CHUNK rows OR MAX_H2_CHARS characters
    data_rows_range = list(range(data_start_row, len(grid)))
    
    # Smart chunking: split by row count or character count
    chunk_start_idx = 0
    while chunk_start_idx < len(data_rows_range):
        # Start new chunk
        if chunk_start_idx > 0:
            markdown_lines.append('')  # Empty line for separation
            # Re-add header
            if header_rows == 0:
                # No header - just add empty header for consistency
                header = [''] * max_cols
                markdown_lines.append('| ' + ' | '.join(header) + ' |')
            elif header_rows > 1:
                header = []
                for col_idx in range(max_cols):
                    combined_content = []
                    for row_idx in range(header_rows):
                        if row_idx == 0 or grid[row_idx][col_idx] != grid[row_idx - 1][col_idx]:
                            content = grid[row_idx][col_idx] or ''
                            if content:
                                combined_content.append(content)
                    header.append(' '.join(combined_content))
                markdown_lines.append('| ' + ' | '.join(header) + ' |')
            else:
                # Single header row - deduplicate consecutive values
                raw_header = [grid[0][col_idx] or '' for col_idx in range(max_cols)]
                header = []
                prev_value = None
                for value in raw_header:
                    if value == prev_value and value != '':
                        header.append('')
                    else:
                        header.append(value)
                    prev_value = value
                markdown_lines.append('| ' + ' | '.join(header) + ' |')
            markdown_lines.append('| ' + ' | '.join(['---'] * max_cols) + ' |')
        
        # Calculate header size for this chunk
        header_text = '\n'.join(markdown_lines[-2:]) if chunk_start_idx > 0 else '\n'.join(markdown_lines)
        current_chunk_chars = len(header_text) + 1  # +1 for newline
        chunk_end_idx = chunk_start_idx
        
        # Add rows until we hit row limit or character limit
        for idx in range(chunk_start_idx, min(chunk_start_idx + MAX_ROWS_PER_CHUNK, len(data_rows_range))):
            row_idx = data_rows_range[idx]
            raw_row = [grid[row_idx][col_idx] or '' for col_idx in range(max_cols)]
            # Deduplicate consecutive values (from colspan)
            row = []
            prev_value = None
            for value in raw_row:
                if value == prev_value and value != '':
                    row.append('')
                else:
                    row.append(value)
                prev_value = value
            
            row_text = '| ' + ' | '.join(row) + ' |\n'
            row_chars = len(row_text)
            
            # Check if adding this row would exceed character limit
            if chunk_end_idx > chunk_start_idx and current_chunk_chars + row_chars > MAX_H2_CHARS:
                # Would exceed limit, stop here
                break
            
            # Check if single row exceeds limit (don't split in this case)
            if chunk_end_idx == chunk_start_idx and row_chars > MAX_H2_CHARS:
                # Single row is too large, include it anyway and move on
                markdown_lines.append('| ' + ' | '.join(row) + ' |')
                chunk_end_idx = idx + 1
                break
            
            # Add the row
            markdown_lines.append('| ' + ' | '.join(row) + ' |')
            current_chunk_chars += row_chars
            chunk_end_idx = idx + 1
        
        # Move to next chunk
        chunk_start_idx = chunk_end_idx
    
    return '\n'.join(markdown_lines)

def convert_html_tables_in_content(content):
    """
    Find all HTML tables in content and convert them to Markdown format.
    """
    # Pattern to match complete HTML tables
    table_pattern = r'<table>.*?</table>'
    
    def replace_table(match):
        html_table = match.group(0)
        return html_table_to_markdown(html_table)
    
    # Replace all tables
    converted = re.sub(table_pattern, replace_table, content, flags=re.DOTALL)
    
    return converted

def extract_toc_section(content):
    """
    Extract the table of contents section from the markdown content.
    Returns: (toc_content, trailing_content, start_pos, end_pos)
    """
    # Find the TOC section - it starts with "# CONTENTS" followed by "# PAGE"
    # and ends when "# 1 " appears for the second time (actual content section)
    toc_start_pattern = r'# CONTENTS\s*\n\s*# PAGE\s*\n'
    start_match = re.search(toc_start_pattern, content, re.DOTALL)
    
    if not start_match:
        return None, None, None, None
    
    start_pos = start_match.start()
    toc_entries_start = start_match.end()
    
    # Find all occurrences of "# 1 " (any section starting with "# 1 ")
    section_1_pattern = r'\n# 1 '
    matches = list(re.finditer(section_1_pattern, content))
    
    if len(matches) < 2:
        # If we can't find the second occurrence, look for any "# 1." pattern as fallback
        fallback_pattern = r'\n# 1\.\d+'
        fallback_match = re.search(fallback_pattern, content[start_match.end():])
        if fallback_match:
            end_pos = start_match.end() + fallback_match.start()
        else:
            return None, None, None, None
    else:
        # The TOC ends right before the second occurrence of "# 1 ..."
        end_pos = matches[1].start()
    
    # Extract TOC entries (for table creation) and trailing content (to preserve)
    full_toc_content = content[toc_entries_start:end_pos]
    
    # Split TOC entries from trailing content
    # TOC entries are lines matching: 
    #   - "# N ..." (section headings in TOC like "# 1 General Information")
    #   - "N.M Title Page" (subsection entries with page numbers)
    #   - "Appendix ..." 
    # Everything after the last TOC entry should be preserved as trailing content
    lines = full_toc_content.split('\n')
    toc_lines = []
    trailing_lines = []
    in_trailing = False
    
    for line in lines:
        stripped = line.strip()
        
        # Check if this line looks like a TOC entry
        is_toc_entry = False
        if stripped:
            # Match patterns like "1.1 Programme Title 1" or "9.22Aegrotat Award 65"
            # Use \s* to allow zero or more spaces after section number
            if re.match(r'^(?:\d+\.)*\d+\s*.+?\s+\d+\s*$', stripped):
                is_toc_entry = True
            # Match "# N Title" patterns (section headings in TOC)
            elif re.match(r'^#\s+\d+\s+', stripped):
                is_toc_entry = True
            # Match "Appendix I ..." (with or without page number at end)
            elif re.match(r'^Appendix\s+[IVX]+', stripped):
                is_toc_entry = True
        
        if in_trailing:
            # Already in trailing section, collect everything
            trailing_lines.append(line)
        elif is_toc_entry:
            # This is a TOC entry
            toc_lines.append(line)
        elif stripped == '':
            # Empty line - could be spacing between TOC entries or before trailing
            # Keep with TOC for now, will be filtered when we find real trailing content
            toc_lines.append(line)
        else:
            # Non-empty, non-TOC line - this starts the trailing content
            in_trailing = True
            trailing_lines.append(line)
    
    toc_entries = '\n'.join(toc_lines)
    trailing_content = '\n'.join(trailing_lines)
    
    return toc_entries, trailing_content, start_pos, end_pos

def parse_toc_line(line):
    """
    Parse a single TOC line to extract section number, title, and page number.
    Returns (section, title, page) or None if not a valid TOC line.
    """
    line = line.strip()
    if not line:
        return None
    
    # Pattern for lines like "1.1 Programme Title 1" or "9.22Aegrotat Award 65"
    # Handle cases where there's no space between section number and title
    pattern = r'^((?:\d+\.)*\d+)\s*(.+?)\s+(\d+)\s*$'
    match = re.match(pattern, line)
    
    if match:
        section = match.group(1)
        title = match.group(2).strip()
        page = match.group(3)
        return (section, title, page)
    
    # Pattern for main headings like "# 1 General Information" or "# 1 ..."
    heading_pattern = r'^#\s+(\d+)\s+(.+)$'
    match = re.match(heading_pattern, line)
    if match:
        section = match.group(1)
        title = match.group(2).strip()
        return (section, title, section)
    
    # Pattern for appendix lines - "Appendix I Subject Description Forms" or "Appendix I"
    appendix_pattern = r'^(Appendix\s+[IVX]+)(?:\s+(.+))?$'
    match = re.match(appendix_pattern, line)
    if match:
        section = match.group(1)
        title = match.group(2) if match.group(2) else ''
        # Return the full text as section if there's additional text
        if title:
            return (f"{section} {title}", '', '')
        else:
            return (section, '', '')
    
    return None

def create_toc_table(toc_content):
    """
    Convert TOC content to HTML table format.
    """
    lines = toc_content.split('\n')
    entries = []
    
    # First pass: collect all entries
    for line in lines:
        # Skip CONTENTS and PAGE header lines
        if line.strip().startswith('#') and ('CONTENTS' in line or 'PAGE' in line):
            continue
        
        parsed = parse_toc_line(line)
        if parsed:
            entries.append(parsed)
        elif line.strip().startswith('Appendix'):
            # Handle Appendix lines that might not have page numbers
            appendix_text = line.strip()
            entries.append((appendix_text, '', ''))
    
    # Second pass: identify first-level pages from their subsections
    first_level_pages = {}
    for section, title, page in entries:
        if '.' not in section and section.isdigit():
            # Look for the first subsection (e.g., "2.1" for section "2")
            subsection_prefix = section + '.'
            for s, t, p in entries:
                if s.startswith(subsection_prefix) and p.isdigit():
                    first_level_pages[section] = p
                    break

    # Build HTML table
    table_html = ['<table>']
    table_html.append('<tr><td>CONTENTS</td><td>PAGE</td></tr>')
    
    for section, title, page in entries:
        # For first-level headings, use the tracked page number from subsections
        if '.' not in section and section.isdigit():
            display_page = first_level_pages.get(section, page)
            table_html.append(f'<tr><td>{section} {title}</td><td>{display_page}</td></tr>')
        elif not section and not title:
            # Skip empty entries
            continue
        elif 'Appendix' in section:
            # Appendix entry with no page number
            table_html.append(f'<tr><td>{section}</td><td>{page}</td></tr>')
        else:
            table_html.append(f'<tr><td>{section} {title}</td><td>{page}</td></tr>')
    
    table_html.append('</table>')
    return '\n'.join(table_html)

def fix_heading_levels(content: str, toc_entries: str) -> str:
    """
    Fix heading levels based on the table of contents structure.
    Remove # from headings not in TOC.
    
    Args:
        content: The markdown content
        toc_entries: The TOC entries string
        
    Returns:
        Content with corrected heading levels
    """
    # Parse TOC to get section structure
    lines = toc_entries.split('\n')
    toc_sections = {}  # Map section numbers to their expected heading level
    
    for line in lines:
        if line.strip().startswith('#') and ('CONTENTS' in line or 'PAGE' in line):
            continue
        
        # Check for Appendix lines
        if line.strip().startswith('Appendix'):
            appendix_text = line.strip()
            toc_sections[appendix_text] = 1
            continue
        
        parsed = parse_toc_line(line)
        if parsed:
            section, title, page = parsed
            
            # Determine heading level based on section depth
            if 'Appendix' in section:
                # Appendix entries should be level 1
                toc_sections[f"{section} {title}"] = 1
            elif '.' not in section:
                # Main sections like "1", "2", etc. are level 1
                toc_sections[f"{section} {title}"] = 1
            else:
                # Subsections like "1.1", "2.3", etc. are level 2
                depth = section.count('.')
                toc_sections[f"{section} {title}"] = depth + 1
    
    # Now fix headings in content
    lines = content.split('\n')
    fixed_lines = []
    in_appendix = False  # Track if we're inside an Appendix section
    
    for line in lines:
        # Check if line is a heading
        heading_match = re.match(r'^(#+)\s+(.+)$', line)
        if heading_match:
            current_hashes = heading_match.group(1)
            heading_text = heading_match.group(2).strip()
            
            # Special case: keep "CONTENTS" as is
            if heading_text == 'CONTENTS':
                fixed_lines.append(line)
                continue
            
            # Special case: check if this is an Appendix heading (marks start of appendix section)
            if re.match(r'^Appendix\s+[IVX]+', heading_text):
                in_appendix = True  # We're now in an appendix section
                fixed_lines.append(f"# {heading_text}")
                continue
            
            # If we're in an appendix, down-level all headings by one
            if in_appendix:
                # For headings in appendix, add one more # to down-level them
                section_match = re.match(r'^((?:\d+\.)*\d+)\s+', heading_text)
                if section_match:
                    section_num = section_match.group(1)
                    # Determine level based on section depth
                    if '.' not in section_num:
                        # Main sections like "1", "2" become level 2 (##)
                        new_level = 2
                    else:
                        # Subsections like "1.1", "5.1" become level 3 (###), etc.
                        depth = section_num.count('.')
                        new_level = depth + 2
                    
                    new_hashes = '#' * new_level
                    fixed_lines.append(f"{new_hashes} {heading_text}")
                    continue
            
            # Not in appendix - use normal TOC-based logic
            matched = False
            
            # First check exact match with TOC entries
            for toc_key, expected_level in toc_sections.items():
                if heading_text == toc_key:
                    new_hashes = '#' * expected_level
                    fixed_lines.append(f"{new_hashes} {heading_text}")
                    matched = True
                    break
            
            if not matched:
                # Check if heading starts with a section number from TOC
                section_match = re.match(r'^((?:\d+\.)*\d+|Appendix\s+[IVX]+)\s+', heading_text)
                if section_match:
                    section_num = section_match.group(1)
                    # Find the TOC key that starts with this section number
                    for toc_k, exp_lvl in toc_sections.items():
                        if toc_k.startswith(section_num + ' '):
                            new_hashes = '#' * exp_lvl
                            fixed_lines.append(f"{new_hashes} {heading_text}")
                            matched = True
                            break
            
            if not matched:
                # Not in TOC - remove the # and make it regular text
                fixed_lines.append(heading_text)
        else:
            fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def ensure_table_integrity(content: str) -> str:
    """
    Ensure HTML tables are kept together by adding markers before/after them.
    This helps Dify's chunker avoid breaking tables across chunks.
    """
    # Add newlines before and after tables to help chunking
    content = re.sub(r'(<table>)', r'\n\n\1', content)
    content = re.sub(r'(</table>)', r'\1\n\n', content)
    return content

def split_h2_sections(content: str) -> str:
    """
    Split H2 sections that exceed MAX_H2_CHARS into multiple parts.
    Splits by paragraph when possible, otherwise by sentence.
    Adds (Part 1), (Part 2), etc. to the H2 heading.
    
    Args:
        content: Markdown content with H2 sections
        
    Returns:
        Content with split H2 sections
    """
    lines = content.split('\n')
    result_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this is an H2 heading
        h2_match = re.match(r'^##\s+(.+)$', line)
        
        if h2_match:
            h2_heading = h2_match.group(1).strip()
            h2_start = i
            
            # Collect all content until next H1 or H2
            h2_content_lines = []
            i += 1
            while i < len(lines):
                next_line = lines[i]
                # Check if we hit another heading
                if re.match(r'^#{1,2}\s+', next_line):
                    break
                h2_content_lines.append(next_line)
                i += 1
            
            # Calculate total character count (including heading)
            h2_content = '\n'.join(h2_content_lines)
            total_chars = len(f"## {h2_heading}\n{h2_content}")
            
            if total_chars <= MAX_H2_CHARS:
                # No split needed
                result_lines.append(f"## {h2_heading}")
                result_lines.extend(h2_content_lines)
            else:
                # Need to split - separate content into paragraphs
                paragraphs = []
                current_para = []
                
                for content_line in h2_content_lines:
                    if content_line.strip() == '':
                        # Empty line marks paragraph boundary
                        if current_para:
                            paragraphs.append('\n'.join(current_para))
                            current_para = []
                        paragraphs.append('')  # Keep empty line
                    else:
                        current_para.append(content_line)
                
                # Don't forget last paragraph
                if current_para:
                    paragraphs.append('\n'.join(current_para))
                
                # Now split paragraphs into parts
                parts = []
                current_part = []
                current_part_size = len(f"## {h2_heading} (Part 1)\n")
                
                for para in paragraphs:
                    para_size = len(para) + 1  # +1 for newline
                    
                    # If adding this paragraph would exceed limit
                    if current_part and current_part_size + para_size > MAX_H2_CHARS:
                        # Save current part
                        parts.append('\n'.join(current_part))
                        current_part = [para]
                        current_part_size = len(f"## {h2_heading} (Part {len(parts) + 1})\n") + para_size
                    else:
                        # Add to current part
                        current_part.append(para)
                        current_part_size += para_size
                
                # Don't forget last part
                if current_part:
                    parts.append('\n'.join(current_part))
                
                # If still only one part (single huge paragraph), split by sentences
                if len(parts) == 1 and len(parts[0]) + len(f"## {h2_heading}\n") > MAX_H2_CHARS:
                    # Split by sentences
                    text = parts[0]
                    # Simple sentence split by ., !, ? followed by space or newline
                    sentences = re.split(r'([.!?](?:\s+|\n+|$))', text)
                    
                    # Reconstruct sentences with punctuation
                    reconstructed = []
                    for j in range(0, len(sentences)-1, 2):
                        if j+1 < len(sentences):
                            reconstructed.append(sentences[j] + sentences[j+1])
                    if len(sentences) % 2 == 1:
                        reconstructed.append(sentences[-1])
                    
                    parts = []
                    current_part = []
                    current_part_size = len(f"## {h2_heading} (Part 1)\n")
                    
                    for sentence in reconstructed:
                        sentence = sentence.strip()
                        if not sentence:
                            continue
                        
                        sentence_size = len(sentence) + 1
                        
                        if current_part and current_part_size + sentence_size > MAX_H2_CHARS:
                            parts.append(' '.join(current_part))
                            current_part = [sentence]
                            current_part_size = len(f"## {h2_heading} (Part {len(parts) + 1})\n") + sentence_size
                        else:
                            current_part.append(sentence)
                            current_part_size += sentence_size
                    
                    if current_part:
                        parts.append(' '.join(current_part))
                
                # Output parts with numbered headings
                for part_num, part_content in enumerate(parts, 1):
                    if len(parts) > 1:
                        result_lines.append(f"## {h2_heading} (Part {part_num})")
                    else:
                        result_lines.append(f"## {h2_heading}")
                    
                    # Add the content
                    for part_line in part_content.split('\n'):
                        result_lines.append(part_line)
        else:
            # Not an H2 heading, just copy the line
            result_lines.append(line)
            i += 1
    
    return '\n'.join(result_lines)

def process_markdown_content(content: str) -> str:
    """
    Process markdown content string and return the processed string with fixed TOC and heading levels.
    
    Args:
        content: Original markdown content as string
        
    Returns:
        Processed markdown content as string
    """
    # Extract and fix TOC section (keep HTML tables as-is since markdown doesn't support colspan/rowspan)
    toc_entries, trailing_content, start_pos, end_pos = extract_toc_section(content)
    
    if toc_entries is None:
        # No TOC found, just convert HTML tables and return
        return convert_html_tables_in_content(content)
    
    # Convert TOC to table
    toc_table = create_toc_table(toc_entries)
    
    # Add headers before table and preserve trailing content after table
    new_toc = '# CONTENTS\n\n' + toc_table + '\n' + trailing_content
    
    # Replace old TOC with new table
    new_content = content[:start_pos] + new_toc + content[end_pos:]
    
    # Fix heading levels based on TOC structure
    new_content = fix_heading_levels(new_content, toc_entries)
    
    # Ensure tables stay together for better chunking
    new_content = ensure_table_integrity(new_content)
    
    # Convert all HTML tables to Markdown format
    new_content = convert_html_tables_in_content(new_content)
    
    # Split H2 sections that exceed MAX_H2_CHARS
    new_content = split_h2_sections(new_content)
    
    return new_content

def main(content: str):
    return {
        "result": process_markdown_content(content)
    }

def count_heading_characters(content: str) -> dict:
    """
    Count characters in each Heading 1 and Heading 2 section, and analyze paragraph lengths.
    H2 sections are included within their parent H1 section.
    Heading text itself is also counted.
    Returns a dictionary with heading information, character counts, and paragraph statistics.
    """
    lines = content.split('\n')
    stats = []
    current_h1 = None
    current_h1_line = None
    current_h2 = None
    current_h2_line = None
    h1_all_content = []  # All content under H1 including H2s
    h2_content = []  # Content under current H2 only
    
    # Track paragraph lengths (paragraphs separated by \n\n) and line lengths (separated by \n)
    paragraph_lengths = []
    line_lengths = []
    
    for i, line in enumerate(lines):
        # Check if this is a heading
        heading_match = re.match(r'^(#{1,2})\s+(.+)$', line)
        
        if heading_match:
            hashes = heading_match.group(1)
            heading_text = heading_match.group(2).strip()
            
            if len(hashes) == 1:  # H1
                # Save previous H2 if exists
                if current_h2:
                    # Include the H2 heading line itself
                    content_with_heading = current_h2_line + '\n' + '\n'.join(h2_content)
                    char_count = len(content_with_heading)
                    stats.append({
                        'type': 'H2',
                        'heading': current_h2,
                        'char_count': char_count
                    })
                    h2_content = []
                    current_h2 = None
                    current_h2_line = None
                
                # Save previous H1 if exists
                if current_h1:
                    # Include the H1 heading line itself
                    content_with_heading = current_h1_line + '\n' + '\n'.join(h1_all_content)
                    char_count = len(content_with_heading)
                    stats.append({
                        'type': 'H1',
                        'heading': current_h1,
                        'char_count': char_count
                    })
                    h1_all_content = []
                
                # Start new H1
                current_h1 = heading_text
                current_h1_line = line
                
            elif len(hashes) == 2:  # H2
                # Save previous H2 if exists
                if current_h2:
                    # Include the H2 heading line itself
                    content_with_heading = current_h2_line + '\n' + '\n'.join(h2_content)
                    char_count = len(content_with_heading)
                    stats.append({
                        'type': 'H2',
                        'heading': current_h2,
                        'char_count': char_count
                    })
                    h2_content = []
                
                # Start new H2
                current_h2 = heading_text
                current_h2_line = line
                # Add H2 heading line to H1's all content
                if current_h1:
                    h1_all_content.append(line)
        else:
            # Regular content line
            if current_h2:
                h2_content.append(line)
                # Also add to H1's all content
                if current_h1:
                    h1_all_content.append(line)
            elif current_h1:
                h1_all_content.append(line)
    
    # Save final sections
    if current_h2:
        # Include the H2 heading line itself
        content_with_heading = current_h2_line + '\n' + '\n'.join(h2_content)
        char_count = len(content_with_heading)
        stats.append({
            'type': 'H2',
            'heading': current_h2,
            'char_count': char_count
        })
    
    if current_h1:
        # Include the H1 heading line itself
        content_with_heading = current_h1_line + '\n' + '\n'.join(h1_all_content)
        char_count = len(content_with_heading)
        stats.append({
            'type': 'H1',
            'heading': current_h1,
            'char_count': char_count
        })
    
    # Calculate paragraph statistics from the entire content
    # Split by double newline to get paragraphs
    paragraphs = content.split('\n\n')
    for para in paragraphs:
        para = para.strip()
        if para:  # Skip empty paragraphs
            paragraph_lengths.append(len(para))
    
    # Calculate line statistics (split by single newline)
    lines_list = content.split('\n')
    for line in lines_list:
        line = line.strip()
        if line:  # Skip empty lines
            line_lengths.append(len(line))
    
    return {
        'sections': stats,
        'paragraph_lengths': paragraph_lengths,
        'line_lengths': line_lengths
    }

def generate_stats_file(stats_data: dict, output_path: Path):
    """
    Generate a statistics text file with heading information, character counts, paragraph and line statistics.
    """
    stats_path = output_path.with_suffix('.txt')
    stats = stats_data['sections']
    paragraph_lengths = stats_data['paragraph_lengths']
    line_lengths = stats_data['line_lengths']
    
    with open(stats_path, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("MARKDOWN HEADING STATISTICS\n")
        f.write("=" * 80 + "\n\n")
        f.write(f"File: {output_path.name}\n")
        f.write(f"Total sections analyzed: {len(stats)}\n\n")
        
        # Summary statistics
        h1_count = sum(1 for s in stats if s['type'] == 'H1')
        h2_count = sum(1 for s in stats if s['type'] == 'H2')
        total_h1_chars = sum(s['char_count'] for s in stats if s['type'] == 'H1')
        total_h2_chars = sum(s['char_count'] for s in stats if s['type'] == 'H2')
        
        f.write(f"Heading 1 (H1) sections: {h1_count}\n")
        f.write(f"Heading 2 (H2) sections: {h2_count}\n")
        f.write(f"Total H1 content characters: {total_h1_chars:,}\n")
        f.write(f"Total H2 content characters: {total_h2_chars:,}\n")
        
        if h1_count > 0:
            max_h1_chars = max(s['char_count'] for s in stats if s['type'] == 'H1')
            f.write(f"Maximum H1 content characters: {max_h1_chars:,}\n")
        if h2_count > 0:
            max_h2_chars = max(s['char_count'] for s in stats if s['type'] == 'H2')
            f.write(f"Maximum H2 content characters: {max_h2_chars:,}\n")
        
        # Paragraph statistics
        f.write("\n" + "-" * 80 + "\n")
        f.write("PARAGRAPH STATISTICS (delimited by \\n\\n)\n")
        f.write("-" * 80 + "\n\n")
        
        if paragraph_lengths:
            f.write(f"Total paragraphs: {len(paragraph_lengths):,}\n")
            f.write(f"Maximum paragraph length: {max(paragraph_lengths):,} characters\n")
            f.write(f"Average paragraph length: {sum(paragraph_lengths) / len(paragraph_lengths):.1f} characters\n")
            f.write(f"Minimum paragraph length: {min(paragraph_lengths):,} characters\n\n")
            
            # Distribution statistics
            para_over_600 = sum(1 for p in paragraph_lengths if p > 600)
            para_over_800 = sum(1 for p in paragraph_lengths if p > 800)
            para_over_1000 = sum(1 for p in paragraph_lengths if p > 1000)
            para_over_2000 = sum(1 for p in paragraph_lengths if p > 2000)
            
            f.write("Paragraph length distribution:\n")
            f.write(f"  Paragraphs > 600 chars: {para_over_600:,} ({para_over_600 / len(paragraph_lengths) * 100:.1f}%)\n")
            f.write(f"  Paragraphs > 800 chars: {para_over_800:,} ({para_over_800 / len(paragraph_lengths) * 100:.1f}%)\n")
            f.write(f"  Paragraphs > 1000 chars: {para_over_1000:,} ({para_over_1000 / len(paragraph_lengths) * 100:.1f}%)\n")
            f.write(f"  Paragraphs > 2000 chars: {para_over_2000:,} ({para_over_2000 / len(paragraph_lengths) * 100:.1f}%)\n")
        
        # Line statistics
        f.write("\n" + "-" * 80 + "\n")
        f.write("LINE STATISTICS (delimited by \\n)\n")
        f.write("-" * 80 + "\n\n")
        
        if line_lengths:
            f.write(f"Total lines: {len(line_lengths):,}\n")
            f.write(f"Maximum line length: {max(line_lengths):,} characters\n")
            f.write(f"Average line length: {sum(line_lengths) / len(line_lengths):.1f} characters\n")
            f.write(f"Minimum line length: {min(line_lengths):,} characters\n\n")
            
            # Distribution statistics
            line_over_100 = sum(1 for l in line_lengths if l > 100)
            line_over_200 = sum(1 for l in line_lengths if l > 200)
            line_over_500 = sum(1 for l in line_lengths if l > 500)
            line_over_1000 = sum(1 for l in line_lengths if l > 1000)
            
            f.write("Line length distribution:\n")
            f.write(f"  Lines > 100 chars: {line_over_100:,} ({line_over_100 / len(line_lengths) * 100:.1f}%)\n")
            f.write(f"  Lines > 200 chars: {line_over_200:,} ({line_over_200 / len(line_lengths) * 100:.1f}%)\n")
            f.write(f"  Lines > 500 chars: {line_over_500:,} ({line_over_500 / len(line_lengths) * 100:.1f}%)\n")
            f.write(f"  Lines > 1000 chars: {line_over_1000:,} ({line_over_1000 / len(line_lengths) * 100:.1f}%)\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("DETAILED BREAKDOWN\n")
        f.write("=" * 80 + "\n\n")
        
        # Separate H1 and H2 sections
        h1_stats = [s for s in stats if s['type'] == 'H1']
        h2_stats = [s for s in stats if s['type'] == 'H2']
        
        # Sort by character count (largest to smallest)
        h1_stats.sort(key=lambda x: x['char_count'], reverse=True)
        h2_stats.sort(key=lambda x: x['char_count'], reverse=True)
        
        # H1 Section
        f.write("--- HEADING 1 (H1) SECTIONS ---\n")
        f.write("(Sorted by character count: largest to smallest)\n\n")
        for i, stat in enumerate(h1_stats, 1):
            f.write(f"{i}. {stat['heading']}\n")
            f.write(f"   Content characters: {stat['char_count']:,}\n\n")
        
        # H2 Section
        f.write("\n" + "-" * 80 + "\n\n")
        f.write("--- HEADING 2 (H2) SECTIONS ---\n")
        f.write("(Sorted by character count: largest to smallest)\n\n")
        for i, stat in enumerate(h2_stats, 1):
            f.write(f"{i}. {stat['heading']}\n")
            f.write(f"   Content characters: {stat['char_count']:,}\n\n")
        
        f.write("=" * 80 + "\n")
        f.write("END OF STATISTICS\n")
        f.write("=" * 80 + "\n")

def process_file(file_path):
    """
    Process a single markdown file and save the result to a new file.
    Also generate a statistics file with heading character counts.
    """
    print(f"Processing: {file_path}")
    
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Process content using the new function
        processed_content = process_markdown_content(content)
        
        # Generate new filename with _processed suffix
        output_path = file_path.with_stem(f"{file_path.stem}_processed")
        
        # Save the processed file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(processed_content)
        
        print(f"  ✓ Processed file saved: {output_path.name}")
        
        # Count characters in headings
        stats = count_heading_characters(processed_content)
        
        # Generate statistics file
        generate_stats_file(stats, output_path)
        
        print(f"  ✓ Statistics file saved: {output_path.with_suffix('.txt').name}")
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        import traceback
        traceback.print_exc()
    

if __name__ == "__main__":
    base_dir = Path.cwd()
    
    # Find both target files
    target_files = [
        list(base_dir.rglob('46408_PRD_2526.md')),
        list(base_dir.rglob('46409_PRD_2526.md'))
    ]
    
    # Flatten the list and remove empty results
    files_to_process = [f[0] for f in target_files if f]
    
    if not files_to_process:
        print("No target files found.")
    else:
        for file_path in files_to_process:
            print(f"Found target file: {file_path}\n")
            process_file(file_path)
        print("\nProcessing complete!")