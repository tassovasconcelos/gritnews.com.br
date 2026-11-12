import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('bridge',Path(__file__).parents[1]/'scripts/sync_procfit_view.py')
bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)

def purchase(**overrides):
    row=dict.fromkeys(bridge.COLUMNS,'')
    row.update(operation_key='distributor',source_id='fixture-1',line_id='1',kind='purchase',occurred_on='2026-11-01',
      source_updated_at='2026-11-01T12:00:00Z',status='posted',product_code='fixture-product',product_name='Fixture only',
      base_unit='UN',supplier_code='fixture-supplier',supplier_name='Fixture supplier',quantity_base='10',unit_cost_landed='2.5',total_landed='25',currency='BRL')
    row.update(overrides);return row

class ContractTests(unittest.TestCase):
    def test_valid_normalized_purchase(self):
        self.assertEqual(bridge.validate(purchase())['total_landed'],'25')
    def test_consumption_needs_sector_or_store(self):
        with self.assertRaises(ValueError):bridge.validate(purchase(kind='consumption'))
        self.assertEqual(bridge.validate(purchase(kind='consumption_return',cost_center_code='STORE-1',operation_key='retail'))['kind'],'consumption_return')
    def test_no_silent_currency_or_unit_conversion(self):
        for change in ({'currency':''},{'currency':'USD'},{'base_unit':''},{'quantity_base':'0'},{'unit_cost_landed':'NaN'},{'total_landed':'26'}):
            with self.subTest(change=change),self.assertRaises(ValueError):bridge.validate(purchase(**change))
    def test_timestamp_requires_timezone(self):
        with self.assertRaises(ValueError):bridge.validate(purchase(source_updated_at='2026-11-01T12:00:00'))
    def test_only_view_identifiers_no_arbitrary_sql(self):
        self.assertIn('[dbo].[vw_Proconsumo]',bridge.view_query('dbo.vw_Proconsumo'))
        for view in ('dbo.view; DROP TABLE x','dbo.vw --','db.dbo.view','[dbo].[view]'):
            with self.assertRaises(ValueError):bridge.view_query(view)
    def test_return_sign_is_not_double_negated(self):
        with self.assertRaises(ValueError):bridge.validate(purchase(kind='purchase_return',quantity_base='-2',total_landed='-5'))
    def test_missing_purchase_supplier_rejected(self):
        with self.assertRaises(ValueError):bridge.validate(purchase(supplier_code=''))

if __name__=='__main__':unittest.main()
