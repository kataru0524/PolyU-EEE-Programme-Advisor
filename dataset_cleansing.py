import re
from pathlib import Path

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
        # No TOC found, return content unchanged
        return content
    
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
    
    return new_content

def main(content: str):
    return {
        "result": process_markdown_content(content)
    }

def count_heading_characters(content: str) -> dict:
    """
    Count characters in each Heading 1 and Heading 2 section.
    H2 sections are included within their parent H1 section.
    Heading text itself is also counted.
    Returns a dictionary with heading information and character counts.
    """
    lines = content.split('\n')
    stats = []
    current_h1 = None
    current_h1_line = None
    current_h2 = None
    current_h2_line = None
    h1_all_content = []  # All content under H1 including H2s
    h2_content = []  # Content under current H2 only
    
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
    
    return stats

def generate_stats_file(stats: list, output_path: Path):
    """
    Generate a statistics text file with heading information and character counts.
    """
    stats_path = output_path.with_suffix('.txt')
    
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