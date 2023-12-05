# telnetlib modülünü içe aktarın
import telnetlib
# sys modülünü içe aktarın
import sys

# yazıcınızın IP adresini ve portunu belirleyin
host = "192.168.1.87"
port = 9100

# komut satırından alınan metin parametresini belirleyin
text = sys.argv[1]

# yazıcınıza telnet bağlantısı açın
tn = telnetlib.Telnet(host, port)

# yazıcınızı sıfırlayın
tn.write(b"\x1b@")
# metni ortala
# tn.write(b"\x1ba\x01")
# üç satır boşluk bırak
tn.write(b"\x1bd\x03")


# metni yaz
tn.write(text.encode("ascii"))
# satır sonu karakteri gönder
tn.write(b"\n")

tn.write(b"\x1bd\x03")
tn.write(b"\x1bd\x03")
tn.write(b"\x1bd\x03")

# kağıdı 11 mm ilerlet
# tn.write(b"\x1b\x4a\x0b")
# kağıdı tamamen kes
tn.write(b"\x1d\x56\x00")
# tn.write(b"\x1b\x69") # kağıdı tamamen kes

# telnet bağlantısını kapat
tn.close()
