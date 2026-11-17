/* compila senza eseguire: cscript //nologo //E:JScript _compila.js file.js */
var fso = new ActiveXObject("Scripting.FileSystemObject");
for (var i = 0; i < WScript.Arguments.length; i++) {
  var f = WScript.Arguments(i);
  var codice = fso.OpenTextFile(f, 1).ReadAll();
  try {
    new Function(codice);
    WScript.Echo("ok  " + f);
  } catch (e) {
    WScript.Echo("KO  " + f + " — " + e.message);
  }
}
