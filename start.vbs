Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Start Server (hidden)
' We assume the folder 'server' exists in the same directory as this script
WshShell.CurrentDirectory = currentDir & "\server"
WshShell.Run "cmd /c npm run dev", 0, False

' Start Client (hidden)
' We assume the folder 'client' exists in the same directory as this script
WshShell.CurrentDirectory = currentDir & "\client"
WshShell.Run "cmd /c npm run dev", 0, False

' Wait 5 seconds for the servers to initialize
WScript.Sleep 5000

' Open the default browser to the client URL
WshShell.Run "http://localhost:5173"

Set WshShell = Nothing
Set fso = Nothing
