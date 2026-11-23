/* controllo di sintassi per i file delle terre — solo compilazione,
   nessuna esecuzione: new Function(codice) compila e basta.
   cscript //nologo //E:JScript _sintassi.js */
var fso = new ActiveXObject("Scripting.FileSystemObject");
var elenco = ["terre\\mondo.js", "terre\\tempio.js", "terre\\stazione.js",
  "terre\\spiaggia.js", "terre\\citta.js", "terre\\case.js", "terre\\fabbriche.js",
  "terre\\bosco.js", "terre\\rovine.js", "terre\\oltrecitta.js", "terre\\suono.js",
  "terre\\stato.js"];
var problemi = 0, i, codice;
for (i = 0; i < elenco.length; i++) {
  if (!fso.FileExists(elenco[i])) { WScript.Echo("- manca " + elenco[i]); continue; }
  codice = fso.OpenTextFile(elenco[i], 1).ReadAll();
  try {
    new Function(codice);
    WScript.Echo("ok  " + elenco[i]);
  } catch (e) {
    problemi++;
    WScript.Echo("NO  " + elenco[i] + " — " + e.message);
  }
}
if (problemi) { WScript.Echo(problemi + " file non si compilano"); WScript.Quit(1); }
WScript.Echo("tutti i file si compilano");
