import os
import re

# Directory containing the markdown files
dir_path = os.path.dirname(os.path.abspath(__file__))

# Output file name
output_file = "eee_facts.md"

# Patterns to remove
footer_pattern = re.compile(r"\[!\[\]\(https://www.polyu.edu.hk/-/media/system-setting/default-chatbot/chatbot-welcome.gif\)\]\(.*?\)\n+We use Cookies.*?\[here\]\(https://www.polyu.edu.hk/en/accessibility/\)\n*", re.DOTALL)

def clean_content(content):
    # Extract YAML front matter if present
    yaml_match = re.match(r"(?s)^(---.*?---\s*)", content)
    yaml = yaml_match.group(1) if yaml_match else ""
    rest = content[len(yaml):] if yaml else content

    # Extract url and title from YAML
    url = ""
    title = ""
    if yaml:
        url_match = re.search(r'url:\s*"([^"]+)"', yaml)
        title_match = re.search(r'title:\s*"([^"]+)"', yaml)
        url = url_match.group(1) if url_match else ""
        title = title_match.group(1) if title_match else ""

    # Remove everything between end of YAML and first H1
    h1_match = re.search(r"^# ", rest, re.MULTILINE)
    if h1_match:
        rest = rest[h1_match.start():]

    # Remove footer block
    rest = footer_pattern.sub("", rest)

    # Remove all markdown images ![alt](url) and ![](url)
    rest = re.sub(r'!\[[^\]]*\]\([^\)]*\)', '', rest)
    # Remove all HTML <img ...> tags
    rest = re.sub(r'<img[^>]*>', '', rest, flags=re.IGNORECASE)

    # Downgrade heading levels: H1->H2, H2->H3, ... (up to H5->H6)
    def downgrade_heading(match):
        hashes = match.group(1)
        # Only downgrade up to H5 (#####), H6 stays as H6
        if len(hashes) < 6:
            return '#' * (len(hashes) + 1) + ' '
        else:
            return hashes + ' '
    rest = re.sub(r'^(#{1,5}) ', downgrade_heading, rest, flags=re.MULTILINE)

    # Compose output: #title\nurl\n\n<rest>
    header = ""
    if title:
        header += f"# {title}\n"
    if url:
        header += f"{url}\n"
    cleaned = (header + '\n' + rest).strip() + "\n"
    return cleaned

md_files = [f for f in os.listdir(dir_path) if f.endswith(".md") and f != output_file]

with open(os.path.join(dir_path, output_file), "w", encoding="utf-8") as outfile:
    for fname in sorted(md_files):
        with open(os.path.join(dir_path, fname), "r", encoding="utf-8") as infile:
            content = infile.read()
            cleaned = clean_content(content)
            outfile.write(cleaned)

print(f"Integrated {len(md_files)} files into {output_file}")
