var fso = new ActiveXObject("Scripting.FileSystemObject");
var f = fso.OpenTextFile(WScript.Arguments(0), 1);
var src = f.ReadAll();
f.Close();
try {
  new Function(src);
  WScript.Echo("SINTASSI OK: " + WScript.Arguments(0));
} catch (e) {
  WScript.Echo("ERRORE: " + e.message);
}
