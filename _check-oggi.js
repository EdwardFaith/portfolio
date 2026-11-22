/* controllo di sintassi dei file toccati — porta del bosco, stanze del
   museo, Charles, schermo intero, spiaggia. Solo compilazione:
   new Function(codice) compila.  cscript //nologo //E:JScript _check-oggi.js */
var elenco = ["museo\\orienta.js", "museo\\charles.js", "museo\\main.js",
  "spiaggia\\game.js", "terre\\zoan.js"];

/* JScript è ES3: `.catch(` dopo il punto lo manda in errore di sintassi,
   nei browser è normalissimo — lo si riscrive prima di compilare. E si
   legge in UTF-8, se no gli accenti diventano caratteri non validi */
function leggi(p) {
  var s = new ActiveXObject("ADODB.Stream");
  s.Type = 2;
  s.Charset = "utf-8";
  s.Open();
  s.LoadFromFile(p);
  var t = s.ReadText();
  s.Close();
  return t.replace(/\.catch\b/g, "[\"catch\"]");
}

var problemi = 0, i, codice;
for (i = 0; i < elenco.length; i++) {
  try {
    codice = leggi(elenco[i]);
  } catch (e) {
    WScript.Echo("- manca " + elenco[i] + " (" + e.message + ")");
    continue;
  }
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
