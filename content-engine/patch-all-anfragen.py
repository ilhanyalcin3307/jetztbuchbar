#!/usr/bin/env python3
"""
Jetztbuchbar batch patcher:
  1. Remove Crisp Chat blocks from all HTML files
  2. Replace mailto "Angebot anfragen" buttons with data-anfrage modal triggers
  3. Inject <script> tags (EmailJS CDN + anfrage-modal.js) before </body>
     on pages that received a new modal button

Skips hotel.html (already has inline modal) for button replacement.
"""
import os, re, glob
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── patterns ──────────────────────────────────────────────────────────────────
CRISP_RE = re.compile(
    r'[ \t]*<!--Start of Crisp Chat-->\s*'
    r'<script[^>]*>.*?</script>\s*'
    r'<!--End of Crisp Chat-->[ \t]*\n?',
    re.DOTALL
)

# <a href="mailto:sales@jetztbuchbar.de?subject=Anfrage DEST" class="btn-primary">✉️ Angebot anfragen</a>
ANFRAGEN_RE = re.compile(
    r'<a\s+href="mailto:sales@jetztbuchbar\.de\?subject=Anfrage\s+([^"]+)"\s+'
    r'class="btn-primary">✉️\s*Angebot anfragen</a>'
)

SCRIPTS_INJECT = (
    '  <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>\n'
    '  <script src="/components/anfrage-modal.js" defer></script>\n'
    '</body>'
)

# ── helpers ───────────────────────────────────────────────────────────────────
def decode_dest(encoded):
    return unquote(encoded.replace('+', ' ')).strip()

def process(fpath):
    is_hotel = os.path.normpath(fpath) == os.path.normpath(os.path.join(ROOT, 'hotel.html'))

    with open(fpath, encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. Remove Crisp
    content = CRISP_RE.sub('', content)

    # 2. Replace anfragen buttons (not on hotel.html – already has inline modal)
    button_replaced = False
    if not is_hotel:
        def replace_btn(m):
            dest = decode_dest(m.group(1))
            return f'<button class="btn-primary" data-anfrage data-name="{dest}">✉️ Angebot anfragen</button>'
        new_content, count = ANFRAGEN_RE.subn(replace_btn, content)
        if count:
            content = new_content
            button_replaced = True

    # 3. Inject scripts before </body> (only when modal button was added and not yet present)
    if button_replaced and 'anfrage-modal.js' not in content:
        content = content.replace('</body>', SCRIPTS_INJECT, 1)

    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# ── main ──────────────────────────────────────────────────────────────────────
all_html = sorted(set(
    glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True) +
    glob.glob(os.path.join(ROOT, '*.html'))
))

changed = []
for fpath in all_html:
    if process(fpath):
        changed.append(os.path.relpath(fpath, ROOT))

print(f'Patched {len(changed)} file(s):')
for p in changed:
    print(' ✓', p)
