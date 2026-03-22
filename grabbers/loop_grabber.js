/**  https://loopcolors.com/product/loop-400ml/  */
(async () => {
    const LABELS = [
        'COLOR NAME',
        'COLOR CODE',
        'HEX CODE',
        'OPACITY',
        'UV RESITENCE'
    ];

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const normalize = (s) => (s || '').replace(/\s+/g, ' ').trim();

    const allElements = () => [...document.querySelectorAll('body *')];

    const findValueAfterLabel = (labelText) => {
        const els = allElements();
        const upper = labelText.toUpperCase();

        const labelIndex = els.findIndex(el => {
            const txt = normalize(el.textContent).toUpperCase();
            return txt === upper;
        });

        if (labelIndex === -1) return null;

        for (let i = labelIndex + 1; i < els.length; i++) {
            const txt = normalize(els[i].textContent);
            if (!txt) continue;
            if (LABELS.includes(txt.toUpperCase())) break;
            return txt;
        }

        return null;
    };

    const colorCandidates = [...document.querySelectorAll('body *')]
        .filter(el => {
            const txt = normalize(el.textContent);
            return /^LP[A-Z-]*-\d{3}\s+.+/i.test(txt);
        })
        .filter(el => {
            const txt = normalize(el.textContent);
            return txt.length < 120;
        });

    const unique = [];
    const seen = new Set();

    for (const el of colorCandidates) {
        const txt = normalize(el.textContent);
        if (!seen.has(txt)) {
            seen.add(txt);
            unique.push(el);
        }
    }

    const results = [];

    for (const el of unique) {
        const raw = normalize(el.textContent);

        try {
            el.scrollIntoView({ block: 'center' });
            await sleep(100);
            el.click();
            await sleep(250);

            const colorName = findValueAfterLabel('COLOR NAME');
            const colorCode = findValueAfterLabel('COLOR CODE');
            const hexCode = findValueAfterLabel('HEX CODE');
            const opacity = findValueAfterLabel('OPACITY');
            const uv = findValueAfterLabel('UV RESITENCE');

            results.push({
                raw,
                reference: colorCode || raw.match(/^(LP[A-Z-]*-\d{3})/i)?.[1] || null,
                name: colorName || raw.replace(/^(LP[A-Z-]*-\d{3})\s+/i, '') || null,
                hex: hexCode || null,
                opacity: opacity || null,
                uv_resistance: uv || null
            });
        } catch (e) {
            results.push({
                raw,
                reference: raw.match(/^(LP[A-Z-]*-\d{3})/i)?.[1] || null,
                name: raw.replace(/^(LP[A-Z-]*-\d{3})\s+/i, '') || null,
                hex: null,
                opacity: null,
                uv_resistance: null,
                error: String(e)
            });
        }
    }

    console.log(JSON.stringify(results, null, 2));

    const blob = new Blob([JSON.stringify(results, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loopcolors-live-extract.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    return results;
})();