[Setup]
AppName=MeCab64
AppVersion=0.996.2
AppVerName=MeCab64 0.996.2
DefaultDirName=C:\Program Files\MeCab
AllowNoIcons=Yes
DefaultGroupName=MeCab64
LicenseFile=BSD
Compression=bzip
SolidCompression=yes
OutputBaseFileName=mecab-64-0.996.2
OutputDir=.
AppPublisher=Taku Kudo
AppPublisherURL=https://taku910.github.io/mecab/
ShowLanguageDialog=yes

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"
Name: "jp"; MessagesFile: "compiler:Languages\Japanese.isl"

[Files]
Source: "AUTHORS";               DestDir: "{app}"
Source: "COPYING";               DestDir: "{app}"
Source: "GPL";                   DestDir: "{app}"
Source: "LGPL";                  DestDir: "{app}"
Source: "BSD";                   DestDir: "{app}"
Source: "installer\bin\mecab.exe";         DestDir: "{app}\bin"

Source: "installer\bin\mecab-*-*.exe";     DestDir: "{app}\bin"
Source: "installer\bin\libmecab.dll";      DestDir: "{app}\bin"
Source: "mecabrc";    DestDir: "{app}\etc"
Source: "installer\sdk\libmecab.lib";  DestDir: "{app}\sdk"
Source: "installer\bin\libmecab.dll";      DestDir: "{app}\bin"
Source: "installer\sdk\mecab.h";  DestDir: "{app}\sdk"
Source: "doc\*.html";   DestDir: "{app}\doc"
Source: "doc\*.png";   DestDir: "{app}\doc"
Source: "doc\*.css";    DestDir: "{app}\doc"
Source: "..\mecab-ipadic\*";  DestDir: "{app}\dic\ipadic"


[Icons]
Name: "{commonprograms}\MeCab64\MeCab";           Filename: "{app}\bin\mecab.exe"
Name: "{commonprograms}\MeCab64\Recompile SHIFT-JIS Dictionary"; WorkingDir: "{app}\dic\ipadic"; Filename: "{app}\bin\mecab-dict-index.exe"; Parameters: "-f EUC-JP -t SHIFT-JIS"; Comment: "Recompile SHIFT-JIS dictionary"
Name: "{commonprograms}\MeCab64\Recompile UTF-8 Dictionary"; WorkingDir: "{app}\dic\ipadic";  Filename: "{app}\bin\mecab-dict-index.exe"; Parameters: "-f EUC-JP -t UTF-8"; Comment: "Recompile UTF-8 dictionary"
Name: "{commonprograms}\MeCab64\Recompile UTF-16 Dictionary"; WorkingDir: "{app}\dic\ipadic";  Filename: "{app}\bin\mecab-dict-index.exe"; Parameters: "-f EUC-JP -t UTF-16"; Comment: "Recompile UTF-16 dictionary"
Name: "{commonprograms}\MeCab64\Recompile EUC-JP Dictionary"; WorkingDir: "{app}\dic\ipadic";  Filename: "{app}\bin\mecab-dict-index.exe"; Parameters: "-f EUC-JP -t EUC-JP"; Comment: "Recompile EUC-JP dictionary"
Name: "{commonprograms}\MeCab64\Uninstall MeCab"; Filename: "{app}\unins000.exe"
Name: "{commonprograms}\MeCab64\MeCab Document";  Filename: "{app}\doc\index.html"
Name: "{userdesktop}\MeCab64"; Filename:  "{app}\bin\mecab.exe"

[Run]
Filename: "{app}\bin\mecab-dict-index.exe"; Parameters: "-f EUC-JP -t {code:GetCharCode}"; WorkingDir: "{app}\dic\ipadic"

[UninstallDelete]
Type: files; Name: "{app}\dic\ipadic\*.bin"
Type: files; Name: "{app}\dic\ipadic\*.dic"

[Registry]
Root: HKLM; Subkey: "software\MeCab"; Flags: uninsdeletekey; ValueType: string; ValueName: "mecabrc"; ValueData: "{app}\etc\mecabrc" ; Check: IsAdmin
Root: HKCU; Subkey: "software\MeCab"; Flags: uninsdeletekey; ValueType: string; ValueName: "mecabrc"; ValueData: "{app}\etc\mecabrc"

[Code]
Program Setup;
var
  IsAdminFlg:         boolean;
  IsAdminCheckedFlg:  boolean;
  UserPage: TInputOptionWizardPage;

Function IsAdmin (): Boolean;
var
  conf: String;
begin
  if not IsAdminLoggedOn () then
  begin
    Result := false;
  end
  else
  begin
    conf := 'You have administrator privileges. Do you permit all users to run MeCab';
    if ActiveLanguage = 'jp' then
    begin
      conf := '�Ǘ��Ҍ������������̂悤�ł��B���̃R���s���[�^�̑S���[�U��MeCab�̎��s�������܂���?';
    end
    if not IsAdminCheckedFlg then
       IsAdminFlg := MsgBox (conf, mbInformation, mb_YesNo) = idYes;
    IsAdminCheckedFlg := true;
    Result := IsAdminFlg;
  end;
end;

Function GetCharCode (Param: String): String;
var
  msg: String;
begin
  msg := 'Start compiling MeCab dictionary. It will take 30-60secs.';
  if ActiveLanguage = 'jp' then
  begin
    msg := 'MeCab�̎������쐬���܂��B��Ƃɂ�1���قǂ�����ꍇ���������܂��B';
  end;
  MsgBox(msg, mbInformation, mb_OK);
  Result := 'SHIFT-JIS';
  if UserPage.Values[0] = True then
  begin
     Result := 'SHIFT-JIS';
  end;
  if UserPage.Values[1] = True then
  begin
     Result := 'UTF-8';
  end;
  if UserPage.Values[2] = True then
  begin
     Result := 'UTF-16';
  end;
  if UserPage.Values[3] = True then
  begin
     Result := 'EUC-JP';
  end;
end;

procedure InitializeWizard;
var
  msg : array[0..3] of String;
begin
  msg[0] := 'Dictionary Charset'
  msg[1] := 'Please choose character set';
  msg[2] := 'Please specify charset set of dictionary, then click Next.';
  if ActiveLanguage = 'jp' then
  begin
    msg[0] := '�����̕����R�[�h�̑I��'
    msg[1] := '�����̕����R�[�h��I�����Ă��������B';
    msg[2] := '�C���X�g�[�����鎫���̕����R�[�h��I����(�ʏ��SHIFT-JIS)�A���ւ��N���b�N���Ă��������B';
  end;
  UserPage := CreateInputOptionPage(wpWelcome, msg[0], msg[1], msg[2], True, True);
  UserPage.Add('SHIFT-JIS');
  UserPage.Add('UTF-8');
  UserPage.Add('UTF-16');
  UserPage.Add('EUC-JP');
  UserPage.Values[0] := True;
end;