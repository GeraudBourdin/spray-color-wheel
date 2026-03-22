/** https://chatgpt.com/c/69b4068a-c9d0-8386-9315-20fa9d48a579
 * https://www.montana-cans.com/Montana-BLACK-400ml/263507
 * */

(() => {
    const EXACT_FOR = 'group[][]';

    const result = [...document.querySelectorAll('label')]
        .filter(label => label.getAttribute('for') === EXACT_FOR)
        .map(label => ({
            name: label.dataset.name ?? null,
            color: label.dataset.color ?? null
        }));

    console.log(JSON.stringify(result, null, 2));

    const data = result;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labels-group-name-color.json';
    a.click();
    URL.revokeObjectURL(url);

    return result;
})();


(() => {
    const EXACT_FOR = 'group[][]';

    const parseColorObject = (value) => {
        if (typeof value !== 'string' || value.trim() === '') {
            return value;
        }

        try {
            const parsed = JSON.parse(value);

            return Object.fromEntries(
                Object.entries(parsed).map(([key, val]) => [
                    key,
                    val === '' ? null : Number(val)
                ])
            );
        } catch (e) {
            return value;
        }
    };

    const result = [...document.querySelectorAll('label')]
        .filter(label => label.getAttribute('for') === EXACT_FOR)
        .map(label => {
            const data = { ...label.dataset };

            data.rgb = parseColorObject(data.rgb);
            data.cmyk = parseColorObject(data.cmyk);

            return data;
        });

    console.log(JSON.stringify(result, null, 2));

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labels-group-dataset.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    return result;
})();