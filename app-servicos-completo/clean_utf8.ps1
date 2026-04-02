
$path = "src/App.tsx"
$content = [IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$pairs = @(
    @("ÃƒÂ¡", "á"), @("ÃƒÂ©", "é"), @("ÃƒÂ­", "í"), @("ÃƒÂ³", "ó"), @("ÃƒÂº", "ú"),
    @("ÃƒÂ§", "ç"), @("ÃƒÂ£", "ã"), @("ÃƒÂµ", "õ"), @("ÃƒÂª", "ê"), @("ÃƒÂ¢", "â"),
    @("ÃƒÂ´", "ô"), @("ÃƒÂ»", "û"), @("ÃƒÂ€", "À"), @("ÃƒÂ‰", "É"), @("ÃƒÂ“", "Ó"),
    @("ÃƒÂ‡", "Ç"), @("ÃƒÂƒ", "Ã"), @("ÃƒÂ±", "ñ"), @("ÃƒÂ²", "ò"), @("ÃƒÂ ", "à"),
    @("ÃƒÂ", "à"), # Fallback genérico para 'à' quando o resto falha
    @("Ã¢Å¡Â¡", "⚡"), @("Ã°Å¸â€™Â³", "💳"), @("Ã°Å¸Â¥Â³", "🥳"), @("Ã¢Å“â€¦", "✅"),
    @("Ã°Å¸â€ºÂµ", "🛵"), @("Ã°Å¸â€œÂ¦", "📦"), @("Ã°Å¸Å¡â‚¬", "🚀"), @("Ã¢Å“Â¨", "✨"),
    @("Ã¢Å¡Â Ã¯Â¸Â ", "⚠️"), @("Ã¢Å¡Â ", "⚠️"), @("Ã°Å¸â€ â€ ", "📍"), @("Ã°Å¸Â¥â€”", "🥗")
)

foreach ($pair in $pairs) {
    if ($content.Contains($pair[0])) {
        $content = $content.Replace($pair[0], $pair[1])
    }
}

# Double/Triple-mangled leftovers
$content = $content.Replace("ÃƒÆ’Ã†â€™Ã‚Â´", "ô")
$content = $content.Replace("ÃƒÆ’Ã†â€™Ã‚Â¡", "á")
$content = $content.Replace("ÃƒÆ’Ã†â€™Ã‚Â§ÃƒÆ’Ã†â€™Ã‚Â£", "ação")
$content = $content.Replace("ÃƒÆ’Ã†â€™Ã‚Â´", "ô")
$content = $content.Replace("ÃƒÆ’Ã†â€™Ã‚Âª", "ê")

[IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Purificação de encoding concluída em $path."
