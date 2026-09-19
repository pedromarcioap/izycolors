import re, sys

with open("/tmp/figma.html", "r", errors="ignore") as f:
    text = f.read()

urls = set(re.findall(r"https?://[^\s\"\'\<\>]+", text))
for u in sorted(urls):
    if "webpack-artifacts" not in u and "w3.org" not in u:
        print(u)
