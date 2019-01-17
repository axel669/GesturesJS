import tea from "@axel669/teascript/rollup";

export default {
    input: "src/gesture.tea",
    output: [
        {
            file: "index.js",
            format: "cjs"
        },
        {
            file: "es6/index.js",
            format: "es"
        },
        {
            file: "standalone/gesture.js",
            format: "iife",
            name: "Gesture"
        }
    ],
    plugins: [
        tea()
    ]
};
