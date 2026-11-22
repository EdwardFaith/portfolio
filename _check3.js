/* conteggi per coniglio-cornice.js: JScript è ES3 e non conosce i
   template literal (`...`), quindi il file non si compila qui — ma si
   può almeno controllare che i delimitarori tornino.
   cscript //nologo //E:JScript _check3.js */
function leggi(p) {
  var s = new ActiveXObject("ADODB.Stream");
  s.Type = 2; s.Charset = "utf-8"; s.Open(); s.LoadFromFile(p);
  var t = s.ReadText(); s.Close(); return t;
}

function conta(t, re) { return t.match(re) ? t.match(re).length : 0; }

var elenco = ["coniglio-cornice.js", "museo\\orienta.js", "museo.html",
  "index.html", "cosmo\\index.html", "terre\\index.html",
  "spiaggia\\index.html", "terza-porta\\index.html"];
var i, t;
for (i = 0; i < elenco.length; i++) {
  t = leggi(elenco[i]);
  WScript.Echo(elenco[i] + ": backtick " + conta(t, /`/g) +
    " · graffe " + conta(t, /\{/g) + "/" + conta(t, /\}/g) +
    " · tonde " + conta(t, /\(/g) + "/" + conta(t, /\)/g) +
    " · quadre " + conta(t, /\[/g) + "/" + conta(t, /\]/g));
}
