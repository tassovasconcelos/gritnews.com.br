import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('audit',Path(__file__).with_name('audit-store-directory.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AuditTests(unittest.TestCase):
 def test_places(self):
  self.assertEqual(m.place('Alameda Exemplo, 10 - Araraquara - São Paulo - Brazil - 14802-428')[:2],('SP','Araraquara'))
  self.assertEqual(m.place('5QQQ+82 Lagoa Nova, Natal - State of Rio Grande do Norte, Brazil')[:2],('RN','Natal'))
  self.assertEqual(m.place('Rua X, 10 - Santos - Sp - CEP 11065-001')[:2],('SP','Santos'))
  self.assertEqual(m.place('Loja Online - Brasil')[:2],(None,None))
  self.assertEqual(m.place('1643 Av. Dom Severino - Piauí - Brasil - 64049-410')[:2],('PI',None))
 def test_web_sources(self):
  self.assertEqual(m.site('https://www.exemplo.com.br/busca?q=theramart'),('https://www.exemplo.com.br/busca?q=theramart','exemplo.com.br',True))
  for u in ['https://user:pass@example.com','http://127.0.0.1','https://a.internal']:
   self.assertEqual(m.site(u),(None,None,False))
  self.assertFalse(m.site('https://www.instagram.com/store')[2])
  self.assertFalse(m.site('https://linktr.ee/store')[2])
if __name__=='__main__':unittest.main()
