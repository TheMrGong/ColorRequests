//@ts-check
import Discord from "discord.js"

/**
 * @param {string} hex Input hex code
 * @returns {RGBColor|null}
 */
export default function hexToRgb(hex) {
    if (hex.startsWith("0x")) hex = hex.substring(2)
    if (hex.startsWith("#")) hex = hex.substring(1)
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? new RGBColor(
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)) : null;
}

/**
 * @param {number} color 
 * @returns {string} Hex code for a single color
 */
function rgbToHex(color) {
    let hex = Number(color).toString(16);
    if (hex.length < 2)
        hex = "0" + hex;
    return hex;
}

export class RGBColor {
    /**
     * 
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     */
    constructor(r, g, b) {
        this.r = r
        this.g = g
        this.b = b
    }

    /**
     * @returns {Discord.HexColorString} Hex code representing the red green and blue
     */
    hexColor() {
        var red = rgbToHex(this.r);
        var green = rgbToHex(this.g);
        var blue = rgbToHex(this.b);
        return `#${red + green + blue}`;
    }

    /**
     * 
     * @param {RGBColor} color 
     * @returns {boolean} if they're the same
     */
    compareAgainst(color) {
        return this.r == color.r && this.g == color.g && this.b == color.b
    }
}

export class RGBColorInfo {
    /**
     * 
     * @param {Discord.HexColorString}  color
     */
     constructor(color) {
        this.color = color
    }
}