import tea from "@axel669/teascript/rollup";
import {terser} from "rollup-plugin-terser";

export default {
    input: "src/gesture.tea",
    output: [
        {
            file: "standalone/gesture.min.js",
            format: "iife",
            name: "Gestures"
        }
    ],
    plugins: [
        tea(),
        terser()
    ]
};
