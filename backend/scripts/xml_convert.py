import xml.etree.ElementTree as ET
import json

# Load XML file
tree = ET.parse("../data/Posts.xml")
root = tree.getroot()

posts = []
for row in root.findall("row"):
    post = {
        "id": row.attrib.get("Id"),
        "creationdate": row.attrib.get("CreationDate"),
        "score": row.attrib.get("Score"),
        "viewcount": row.attrib.get("ViewCount"),
        "body": row.attrib.get("Body"),
        "title": row.attrib.get("Title"),
        "tags": row.attrib.get("Tags")
    }
    posts.append(post)

# Save to a json file
with open("../data/posts.json","w") as f:
    json.dump(posts,f,indent=4)

print("Conversion Complete! Saved as posts.json")