import fs from "fs";

const map = {
  "Ã¡": "á", "Ã©": "é", "Ã\xad": "í", "Ã³": "ó", "Ãº": "ú",
  "Ã§": "ç", "Ã£": "ã", "Ãµ": "õ", "Ãª": "ê", "Ã¢": "â",
  "Ã´": "ô", "Ã»": "û", "Ã€": "À", "Ã‰": "É", "Ã“": "Ó",
  "Ã‡": "Ç", "Ãƒ": "Ã", "Ã±": "ñ", "Ã²": "ò", "Ã ": "à",
  "Ã¯": "ï",
  "Ã°Å¸â€™Â³": "💳", "Ã°Å¸Â¥Â³": "🥳", "Ã¢Å“â€¦": "✅",
  "Ã°Å¸â€ºÂµ": "🛵", "Ã°Å¸â€œÂ¦": "📦", "Ã°Å¸Å¡â‚¬": "🚀",
  "Ã¢Å“Â¨": "✨", "Ã¢Å¡Â Ã¯Â¸Â ": "⚠️", "Ã¢Å¡Â ": "⚠️",
  "Ã°Å¸â€ â€ ": "📍", "Ã°Å¸Â¥â€”": "🥗", "âš¡": "⚡",
  "ðŸ’³": "💳", "âœ…": "✅", "ðŸ¥—": "🥗", "ðŸ›µ": "🛵",
  "ðŸš€": "🚀", "ðŸ””": "🔔", "âš ï¸ ": "⚠️"
};

let filepath = "./src/App.tsx";
let txt = fs.readFileSync(filepath, "utf8");

for (let [bad, good] of Object.entries(map)) {
  txt = txt.split(bad).join(good);
}

// Ensure "Próximo" is fixed correctly
txt = txt.replace(/PrÃ³ximo/g, "Próximo");
txt = txt.replace(/PreÃ§o/g, "Preço");

fs.writeFileSync(filepath, txt, "utf8");
console.log("App.tsx encoding cleanup completed successfully.");
