/**
 * Product Data
 * All available products for doors and gates
 */

// Allgemeine Zubehöre (für alle Kategorien)
export const generalAccessories = [
    { id: 200, name: "Betoplan", price: 23, unit: "m²" },
    { id: 201, name: "Blech verzinkt 0,75mm", price: 15, unit: "m²" },
    { id: 202, name: "Garagentorblech verzinkt", price: 27, unit: "m²" },
    { id: 203, name: "Garagentorblech verzinkt in Teak", price: 47, unit: "m²" },
    { id: 204, name: "Niro-Blech 1mm", price: 78, unit: "m²" },
    { id: 205, name: "KU-Profil weiß 18mm", price: 27, unit: "m²" },
    { id: 206, name: "Lärchenholz", price: 17, unit: "m²" },
    { id: 207, name: "3-Schichtplatte NR: 10010892", price: 27, unit: "m²" },
    { id: 208, name: "3-Schichtplatte NR: 10001376", price: 40, unit: "m²" },
    { id: 209, name: "3-Schichtplatte NR: 10001377", price: 52, unit: "m²" },
    { id: 210, name: "3-Schichtplatte NR: 10010888", price: 54, unit: "m²" },
    { id: 211, name: "3-Schichtplatte NR: 10010889", price: 76, unit: "m²" },
    { id: 212, name: "3-Schichtplatte NR: 10001378", price: 84, unit: "m²" },
    { id: 213, name: "3-Schichtplatte NR: 10010890", price: 84, unit: "m²" },
    { id: 214, name: "3-Schichtplatte NR: 10001379", price: 115, unit: "m²" },
    { id: 215, name: "3-Schichtplatte NR: 10010891", price: 120, unit: "m²" },
    { id: 216, name: "KU-Verglasung 8mm", price: 68, unit: "m²" },
    { id: 217, name: "KU-Verglasung 16mm", price: 91, unit: "m²" },
    { id: 218, name: "Plexiglas 5mm", price: 119, unit: "m²" },
    { id: 219, name: "Isolierglas", price: 208, unit: "m²" },
    { id: 220, name: "Schlösser gleichsperrend", price: 5.5, unit: "Stück" },
    { id: 221, name: "Zylinderschloss", price: 20.5, unit: "Stück" },
    { id: 222, name: "Zylinderschloss, gleichsperrend", price: 26, unit: "Stück" },
    { id: 223, name: "Torhalter KU", price: 12.5, unit: "Stück" },
    { id: 224, name: "Gegenhalter Gummi", price: 12.5, unit: "Stück" },
    { id: 225, name: "Gummi 4mm", price: 54, unit: "lm" },
    { id: 226, name: "Katzentürl", price: 162, unit: "Stück" },
    { id: 227, name: "KU-Glas 8mm in ganzen Platten", price: 25, unit: "m²" },
    { id: 228, name: "KU-Glas 8mm zugeschnitten", price: 32.5, unit: "m²" },
    { id: 229, name: "KU-Glas 16mm in ganzen Platten", price: 46.6, unit: "m²" },
    { id: 230, name: "KU-Glas 16mm zugeschnitten", price: 60.6, unit: "m²" },
    { id: 231, name: "KU H-Profil für 16mm Glas", price: 17, unit: "lm" },
    { id: 232, name: "Alu U-Profil 16mm nicht montiert", price: 5, unit: "lm" },
    { id: 233, name: "Alu U-Profil 16mm montiert", price: 9, unit: "lm" },
    { id: 234, name: "Alu U-Profil 16mm 25x25x25x2 nicht montiert", price: 6, unit: "lm" },
    { id: 235, name: "Spezial Alu U-Profil nicht montiert", price: 9, unit: "lm" },
    { id: 236, name: "Spezial Alu U-Profil montiert", price: 13, unit: "lm" },
    { id: 237, name: "Betoplan in ganzen Platten", price: 21.5, unit: "m²" },
    { id: 238, name: "Betoplan zugeschnitten", price: 36.5, unit: "m²" }
];

// Produktdaten nach Kategorien
export const productsByCategory = {
    'Türen': {
        main: [
            { id: 1, name: "Türe aussen Holz/innen Holz", price: 225, unit: "m²" },
            { id: 2, name: "Türe mit einwandiger Holzfüllung", price: 202, unit: "m²" },
            { id: 3, name: "Türe ohne Füllung", price: 168, unit: "m²" },
            { id: 4, name: "Doppelflüglig bis max 4m²", price: 139, unit: "m²" },
            { id: 5, name: "Waagrecht geteilte Tür", price: 132, unit: "m²" },
            { id: 6, name: "Fensterschutzgitter für Pferdeboxen", price: 131, unit: "m²" }
        ],
        accessories: [
            { id: 7, name: "Versenkter Muschelgriff", price: 39, unit: "Stück" },
            { id: 8, name: "Feststehendes Fenster ohne Glas", price: 55, unit: "Stück" },
            { id: 9, name: "Schiebefenster ohne Glas", price: 128, unit: "Stück" },
            { id: 10, name: "Feststehende Oberlichte ohne Glas", price: 147, unit: "m²" },
            { id: 11, name: "Feststehende Oberlichte mit Kippfenster ohne Glas", price: 189, unit: "m²" }
        ]
    },
    'Flügeltore und Falttore': {
        main: [
            { id: 12, name: "Flügeltor bis 4 m²", price: 225, unit: "m²" },
            { id: 13, name: "Flügeltor bis 7 m²", price: 221, unit: "m²" },
            { id: 14, name: "Flügeltor bis 11 m²", price: 185, unit: "m²" },
            { id: 15, name: "Flügeltor bis 15 m²", price: 161, unit: "m²" },
            { id: 16, name: "Flügeltor bis 20 m²", price: 145, unit: "m²" },
            { id: 17, name: "Flügeltor über 20 m²", price: 139, unit: "m²" },
            { id: 23, name: "Falttor bis 4 m²", price: 225, unit: "m²" },
            { id: 24, name: "Falttor bis 7 m²", price: 221, unit: "m²" },
            { id: 25, name: "Falttor bis 11 m²", price: 185, unit: "m²" },
            { id: 26, name: "Falttor bis 15 m²", price: 161, unit: "m²" },
            { id: 27, name: "Falttor bis 20 m²", price: 145, unit: "m²" },
            { id: 28, name: "Falttor über 20 m²", price: 139, unit: "m²" }
        ],
        accessories: [
            { id: 18, name: "mit einwandiger Holzfüllung", price: -13, unit: "m²" },
            { id: 19, name: "ohne Füllung", price: -37, unit: "m²" },
            { id: 20, name: "Gehtüre eingebaut", price: 320, unit: "Stück" },
            { id: 21, name: "Waagrecht geteiltes Tor", price: 148, unit: "m²" },
            { id: 22, name: "zusätzl. Exzenter-Feststellriegel", price: 19, unit: "Stück" },
            { id: 29, name: "Aufpreis zum Flügeltor je Faltung", price: 182, unit: "Stück" },
            { id: 30, name: "Führungsschiene mit Rollen und Halterung", price: 47, unit: "lm" },
            { id: 31, name: "Feststehendes Fenster ohne Glas", price: 76, unit: "Stück" },
            { id: 32, name: "Schiebefenster ohne Glas", price: 147, unit: "Stück" },
            { id: 33, name: "Schiebefenster zweiteilig ohne Glas", price: 264, unit: "Stück" }
        ]
    },
    'Schubtore': {
        main: [
            { id: 34, name: "Schubtor bis 4 m²", price: 207, unit: "m²" },
            { id: 35, name: "Schubtor bis 7 m²", price: 173, unit: "m²" },
            { id: 36, name: "Schubtor bis 11 m²", price: 144, unit: "m²" },
            { id: 37, name: "Schubtor bis 15 m²", price: 124, unit: "m²" },
            { id: 38, name: "Schubtor bis 20 m²", price: 108, unit: "m²" },
            { id: 39, name: "Schubtor über 20 m²", price: 105, unit: "m²" },
            { id: 43, name: "Schiebetür bis 3m²", price: 195, unit: "m²" }
        ],
        accessories: [
            { id: 40, name: "Minderpreis einwandige Füllung", price: -13, unit: "m²" },
            { id: 41, name: "ohne Füllung", price: -37, unit: "m²" },
            { id: 42, name: "Teilung über 2,5m", price: 182, unit: "Stück" },
            { id: 44, name: "feststehendes Fenster ohne Glas", price: 56, unit: "Stück" },
            { id: 45, name: "Schiebefenster innen (nur bei einwandiger Füllung)", price: 139, unit: "Stück" },
            { id: 46, name: "Schiebefenster aussen", price: 165, unit: "Stück" },
            { id: 47, name: "Gehtür eingebaut", price: 320, unit: "Stück" },
            { id: 48, name: "Schubtorverschluss in Mauerleibung", price: 33, unit: "Stück" },
            { id: 49, name: "Versenkter Muschelgriff mit Niro-Klappring", price: 39, unit: "Stück" },
            { id: 50, name: "Hakenschloss", price: 106, unit: "Stück" }
        ]
    },
    'Schiebetüren': {
        main: [
            { id: 55, name: "Betoplan", price: 23, unit: "m²" },
            { id: 56, name: "Blech verzinkt 0,75mm", price: 15, unit: "m²" },
            { id: 57, name: "Garagentorblech verzinkt", price: 27, unit: "m²" },
            { id: 58, name: "Garagentorblech verzinkt in Teak", price: 47, unit: "m²" },
            { id: 59, name: "Niro-Blech 1mm", price: 78, unit: "m²" },
            { id: 60, name: "Lärchenholz", price: 17, unit: "m²" },
            { id: 93, name: "KU-Profil weiß 18mm", price: 27, unit: "m²" }
        ],
        accessories: [
            { id: 61, name: "3-Schichtplatte NR: 10010892", price: 27, unit: "m²" },
            { id: 62, name: "3-Schichtplatte NR: 10001376", price: 40, unit: "m²" },
            { id: 63, name: "3-Schichtplatte NR: 10001377", price: 52, unit: "m²" },
            { id: 64, name: "3-Schichtplatte NR: 10010888", price: 54, unit: "m²" },
            { id: 65, name: "3-Schichtplatte NR: 10010889", price: 76, unit: "m²" },
            { id: 66, name: "3-Schichtplatte NR: 10001378", price: 84, unit: "m²" },
            { id: 67, name: "3-Schichtplatte NR: 10010890", price: 84, unit: "m²" },
            { id: 68, name: "3-Schichtplatte NR: 10001379", price: 115, unit: "m²" },
            { id: 69, name: "3-Schichtplatte NR: 10010891", price: 120, unit: "m²" },
            { id: 70, name: "KU-Verglasung 8mm", price: 68, unit: "m²" },
            { id: 71, name: "KU-Verglasung 16mm", price: 91, unit: "m²" },
            { id: 72, name: "Plexiglas 5mm", price: 119, unit: "m²" },
            { id: 73, name: "Isolierglas", price: 208, unit: "m²" },
            { id: 74, name: "Schlösser gleichsperrend", price: 5.5, unit: "Stück" },
            { id: 75, name: "Zylinderschloss", price: 20.5, unit: "Stück" },
            { id: 76, name: "Zylinderschloss, gleichsperrend", price: 26, unit: "Stück" },
            { id: 77, name: "Torhalter KU", price: 12.5, unit: "Stück" },
            { id: 78, name: "Gegenhalter Gummi", price: 12.5, unit: "Stück" },
            { id: 79, name: "Gummi 4mm", price: 54, unit: "lm" },
            { id: 80, name: "Katzentürl", price: 162, unit: "Stück" },
            { id: 81, name: "KU-Glas 8mm in ganzen Platten", price: 25, unit: "m²" },
            { id: 82, name: "KU-Glas 8mm zugeschnitten", price: 32.5, unit: "m²" },
            { id: 83, name: "KU-Glas 16mm in ganzen Platten", price: 46.6, unit: "m²" },
            { id: 84, name: "KU-Glas 16mm zugeschnitten", price: 60.6, unit: "m²" },
            { id: 85, name: "KU H-Profil für 16mm Glas", price: 17, unit: "lm" },
            { id: 86, name: "Alu U-Profil 16mm nicht montiert", price: 5, unit: "lm" },
            { id: 87, name: "Alu U-Profil 16mm montiert", price: 9, unit: "lm" },
            { id: 88, name: "Alu U-Profil 16mm 25x25x25x2 nicht montiert", price: 6, unit: "lm" },
            { id: 89, name: "Spezial Alu U-Profil nicht montiert", price: 9, unit: "lm" },
            { id: 90, name: "Spezial Alu U-Profil montiert", price: 13, unit: "lm" },
            { id: 91, name: "Betoplan in ganzen Platten", price: 21.5, unit: "m²" },
            { id: 92, name: "Betoplan zugeschnitten", price: 36.5, unit: "m²" }
        ]
    }
};

/**
 * Get all products for a specific category
 * @param {string} category
 * @returns {Array}
 */
export function getProductsForCategory(category) {
    const categoryData = productsByCategory[category];
    if (!categoryData) return [];

    return [
        ...categoryData.main,
        ...categoryData.accessories,
        ...generalAccessories
    ];
}

/**
 * Find product by ID
 * @param {number} productId
 * @returns {Object|null}
 */
export function findProductById(productId) {
    // Search in all categories
    for (const category of Object.values(productsByCategory)) {
        const product = [...category.main, ...category.accessories]
            .find(p => p.id === productId);
        if (product) return product;
    }

    // Search in general accessories
    return generalAccessories.find(p => p.id === productId) || null;
}
