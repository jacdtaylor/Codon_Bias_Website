import json

go_path = '/Users/tessabass/Desktop/bio494r/fall2024/gene_ontology_terms.txt'

with open(go_path) as inf:
    go_dict = {}
    obsolete = False
    for line in inf:
        line = line.strip()
        if line.startswith('id:'):
            id = line[4:]
        if line.startswith('name: '):
            if 'obsolete' in line:
                obsolete = True
            else:
                obsolete = False
                go_dict[id] = {'name': '', 
                               'category': '', 
                               'alt_id': '', 
                               'definition': '', 
                               'synonym': '', 
                               'associated_with': ''}
                name = line[6:]
                go_dict[id]['name'] = name
        if line.startswith('namespace:') and not obsolete:
            category = line[11:]
            go_dict[id]['category'] = category
        if line.startswith('alt_id:') and not obsolete:
            alt_id = line[8:]
            go_dict[id]['alt_id'] = alt_id
        if line.startswith('def:') and not obsolete:
            definition = line[6:line.index('."')]
            go_dict[id]['definition'] = definition
        if line.startswith('synonym:') and not obsolete:
            synonym = line[10:line.index('" ')]
            go_dict[id]['synonym'] = synonym
        if line.startswith('is_a:') and not obsolete:
            association = line[6:]
            go_dict[id]['associated_with'] = association

ref_dict = {}
for key in go_dict:
    if key.startswith("GO"):
        ref_dict[go_dict[key]['name']] = key

print(ref_dict)

# with open('/Users/tessabass/Desktop/bio494r/winter2024/Codon_Bias_Website/Codon_Bias_Website/data/gene_ontology_terms.json', 'w') as outf:
#     json.dump(go_dict, outf, indent=4)

with open('/Users/tessabass/Desktop/bio494r/winter2024/Codon_Bias_Website/Codon_Bias_Website/data/go_terms_reference.json', 'w') as outf:
    json.dump(ref_dict, outf, indent=4)