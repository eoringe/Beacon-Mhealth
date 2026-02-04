const parseName = (nameField) => {
    if (!nameField) return 'Unknown';
    try {
        if (typeof nameField === 'string' && nameField.startsWith('{')) {
            const parsed = JSON.parse(nameField);
            return `${parsed.first_name || ''} ${parsed.middle_name || ''} ${parsed.last_name || ''}`.trim().replace(/\s+/g, ' ');
        }
        if (typeof nameField === 'object') {
            return `${nameField.first_name || ''} ${nameField.middle_name || ''} ${nameField.last_name || ''}`.trim().replace(/\s+/g, ' ');
        }
    } catch (e) { }
    return nameField;
};

const test1 = '{"first_name": "Angela", "middle_name": "Nyaga", "last_name": ""}';
const test2 = { first_name: "Angela", middle_name: "Nyaga", last_name: "" };
const test3 = '{"first_name": "John", "last_name": "Doe"}';

console.log('Test 1:', parseName(test1));
console.log('Test 2:', parseName(test2));
console.log('Test 3:', parseName(test3));
