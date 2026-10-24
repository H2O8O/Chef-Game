// NIVELES CON TIEMPOS REDUCIDOS 55% (x 0.45)
const LEVELS = [
    {
        id: 1,
        name: "Entrada Básica",
        difficulty: 1,
        timeLimit: 81, // 180 * 0.45
        system: { eq1: "x + y = 5", eq2: "2x + y = 8" },
        steps: [
            { instruction: "Despeja x de la primera ecuación", answer: "x = 5 - y", ingredients: ["x", "=", "5", "-", "y"] },
            { instruction: "Sustituye en la segunda ecuación", answer: "2(5 - y) + y = 8", ingredients: ["2", "(", "5", "-", "y", ")", "+", "y", "=", "8"] },
            { instruction: "Resuelve para y", answer: "y = 2", ingredients: ["y", "=", "2"] },
            { instruction: "Sustituye y en x = 5 - y", answer: "x = 3", ingredients: ["x", "=", "3"] }
        ]
    },
    {
        id: 2,
        name: "Sopa del Día",
        difficulty: 1.2,
        timeLimit: 77, // 170 * 0.45
        system: { eq1: "x + y = 7", eq2: "3x + 2y = 19" },
        steps: [
            { instruction: "Despeja x de la primera ecuación", answer: "x = 7 - y", ingredients: ["x", "=", "7", "-", "y"] },
            { instruction: "Sustituye en la segunda ecuación", answer: "3(7 - y) + 2y = 19", ingredients: ["3", "(", "7", "-", "y", ")", "+", "2y", "=", "19"] },
            { instruction: "Resuelve para y", answer: "y = 2", ingredients: ["y", "=", "2"] },
            { instruction: "Sustituye y encuentra x", answer: "x = 5", ingredients: ["x", "=", "5"] }
        ]
    },
    {
        id: 3,
        name: "Plato Fuerte",
        difficulty: 1.4,
        timeLimit: 72, // 160 * 0.45
        system: { eq1: "2x + y = 10", eq2: "x + 3y = 12" },
        steps: [
            { instruction: "Despeja x de la segunda ecuación", answer: "x = 12 - 3y", ingredients: ["x", "=", "12", "-", "3y"] },
            { instruction: "Sustituye en la primera ecuación", answer: "2(12 - 3y) + y = 10", ingredients: ["2", "(", "12", "-", "3y", ")", "+", "y", "=", "10"] },
            { instruction: "Resuelve para y", answer: "y = 2.8", ingredients: ["y", "=", "2.8"] },
            { instruction: "Sustituye y encuentra x", answer: "x = 3.6", ingredients: ["x", "=", "3.6"] }
        ]
    },
    {
        id: 4,
        name: "Especialidad",
        difficulty: 1.6,
        timeLimit: 68, // 150 * 0.45
        system: { eq1: "3x + y = 11", eq2: "x + 2y = 8" },
        steps: [
            { instruction: "Despeja y de la primera ecuación", answer: "y = 11 - 3x", ingredients: ["y", "=", "11", "-", "3x"] },
            { instruction: "Sustituye en la segunda ecuación", answer: "x + 2(11 - 3x) = 8", ingredients: ["x", "+", "2", "(", "11", "-", "3x", ")", "=", "8"] },
            { instruction: "Resuelve para x", answer: "x = 2.8", ingredients: ["x", "=", "2.8"] },
            { instruction: "Sustituye x y encuentra y", answer: "y = 2.6", ingredients: ["y", "=", "2.6"] }
        ]
    },
    {
        id: 5,
        name: "Desafío del Chef",
        difficulty: 1.8,
        timeLimit: 63, // 140 * 0.45
        system: { eq1: "2x + 3y = 13", eq2: "4x + y = 11" },
        steps: [
            { instruction: "Despeja y de la segunda ecuación", answer: "y = 11 - 4x", ingredients: ["y", "=", "11", "-", "4x"] },
            { instruction: "Sustituye en la primera ecuación", answer: "2x + 3(11 - 4x) = 13", ingredients: ["2x", "+", "3", "(", "11", "-", "4x", ")", "=", "13"] },
            { instruction: "Resuelve para x", answer: "x = 2", ingredients: ["x", "=", "2"] },
            { instruction: "Sustituye x y encuentra y", answer: "y = 3", ingredients: ["y", "=", "3"] }
        ]
    },
    {
        id: 6,
        name: "Receta Secreta",
        difficulty: 2.0,
        timeLimit: 59, // 130 * 0.45
        system: { eq1: "5x + 2y = 21", eq2: "3x + 4y = 19" },
        steps: [
            { instruction: "Despeja x de la segunda ecuación", answer: "x = (19 - 4y) / 3", ingredients: ["x", "=", "(", "19", "-", "4y", ")", "/", "3"] },
            { instruction: "Sustituye en la primera ecuación", answer: "5((19 - 4y) / 3) + 2y = 21", ingredients: ["5", "(", "(", "19", "-", "4y", ")", "/", "3", ")", "+", "2y", "=", "21"] },
            { instruction: "Resuelve para y", answer: "y = 2", ingredients: ["y", "=", "2"] },
            { instruction: "Sustituye y encuentra x", answer: "x = 3.67", ingredients: ["x", "=", "3.67"] }
        ]
    },
    {
        id: 7,
        name: "Banquete Real",
        difficulty: 2.2,
        timeLimit: 54, // 120 * 0.45
        system: { eq1: "4x + 5y = 33", eq2: "2x + 3y = 19" },
        steps: [
            { instruction: "Despeja x de la segunda ecuación", answer: "x = (19 - 3y) / 2", ingredients: ["x", "=", "(", "19", "-", "3y", ")", "/", "2"] },
            { instruction: "Sustituye en la primera ecuación", answer: "4((19 - 3y) / 2) + 5y = 33", ingredients: ["4", "(", "(", "19", "-", "3y", ")", "/", "2", ")", "+", "5y", "=", "33"] },
            { instruction: "Resuelve para y", answer: "y = 5", ingredients: ["y", "=", "5"] },
            { instruction: "Sustituye y encuentra x", answer: "x = 2", ingredients: ["x", "=", "2"] }
        ]
    },
    {
        id: 8,
        name: "La Cena del Profesor",
        difficulty: 2.5,
        timeLimit: 50, // 110 * 0.45
        system: { eq1: "6x + 7y = 52", eq2: "5x + 3y = 31" },
        steps: [
            { instruction: "Despeja x de la segunda ecuación", answer: "x = (31 - 3y) / 5", ingredients: ["x", "=", "(", "31", "-", "3y", ")", "/", "5"] },
            { instruction: "Sustituye en la primera ecuación", answer: "6((31 - 3y) / 5) + 7y = 52", ingredients: ["6", "(", "(", "31", "-", "3y", ")", "/", "5", ")", "+", "7y", "=", "52"] },
            { instruction: "Resuelve para y", answer: "y = 2", ingredients: ["y", "=", "2"] },
            { instruction: "Sustituye y encuentra x", answer: "x = 5", ingredients: ["x", "=", "5"] }
        ]
    }
];