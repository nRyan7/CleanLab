import os
import re

def split_corpus(input_file, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Approach: Use Regex with lookahead to handle content containing '}' safely
    # We look for {text: ... } blocks.
    # The non-greedy match (.*?) stops at the first '}', which might be wrong if content has '}'.
    # A better heuristic for this specific "dummy" format:
    # Match {text: ... } where the closing } is followed by either another {text: or End of File.
    
    pattern = re.compile(r'\{text:(.*?)\}\s*(?=\{text:|$)', re.DOTALL)
    
    matches = pattern.findall(content)
    
    if not matches:
        print("Warning: No articles found matching format '{text: ...}'. Trying looser fallback...")
        # Fallback: simple split if regex fails completely?
        # Let's just rely on regex for now.
    
    for i, article_content in enumerate(matches):
        article_content = article_content.strip()
        if not article_content:
            continue
            
        output_filename = os.path.join(output_dir, f"article_{i}.txt")
        with open(output_filename, 'w', encoding='utf-8') as out_f:
            out_f.write(article_content)
        count += 1

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python split_corpus.py <input_file> [output_dir]")
    else:
        input_file = sys.argv[1]
        output_dir = sys.argv[2] if len(sys.argv) > 2 else "corpus_split"
        split_corpus(input_file, output_dir)
