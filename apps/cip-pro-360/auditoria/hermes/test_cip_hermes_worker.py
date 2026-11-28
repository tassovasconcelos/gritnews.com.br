import contextlib
import io
import json
import os
import sys
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import cip_hermes_worker as worker

class TestWorker(unittest.TestCase):
    def test_response_contract(self):
        value={"diagnosis":"Diagnóstico sustentado pelo ciclo","next_action":"Verificar fonte atual antes de decidir","learning_candidate":"Aprender apenas depois de verificar a evidência disponível","evidence_refs":["cycle:known"]}
        self.assertEqual(worker.validate_answer(json.dumps(value),{"cycle:known"}),value)
        for refs in (["unknown"],[],["cycle:known"]*21):
            with self.assertRaises(ValueError):worker.validate_answer(json.dumps({**value,"evidence_refs":refs}),{"cycle:known"})
        with self.assertRaises(ValueError):worker.validate_answer(json.dumps({**value,"approval":True}),{"cycle:known"})
    def test_freshness(self):
        now=datetime.now(timezone.utc)
        self.assertTrue(worker.fresh({"updated_at":now.isoformat()}))
        self.assertFalse(worker.fresh({"updated_at":(now-timedelta(minutes=26)).isoformat()}))
        self.assertFalse(worker.fresh({"updated_at":(now+timedelta(minutes=2)).isoformat()}))
    def test_dry_run_and_dedup(self):
        row={"company_id":"shopping_prohospital","agent_id":"doquita","cycle_id":"c1","role_name":"Doquita","next_action":"Conferir fonte","evidence":{"stale":True,"guardian":[]},"approved_skill_count":0,"reviewed_case_count":0,"updated_at":datetime.now(timezone.utc).isoformat()}
        for existing in ([],[{"id":"existing"}]):
            with patch.dict(os.environ,{"CIP_PUBLISHABLE_KEY":"fake","CIP_ACCESS_TOKEN":"fake"}),patch.object(sys,"argv",["worker","--company","shopping_prohospital","--agent","doquita"]),patch.object(worker,"rest",side_effect=[[{"enabled":True}],[row],existing]),patch.object(worker,"request") as model,contextlib.redirect_stdout(io.StringIO()) as out:
                worker.main()
                self.assertFalse(model.called)
                self.assertEqual(json.loads(out.getvalue())["status"],"already_registered" if existing else "ready_for_operator")
    def test_pause(self):
        with patch.dict(os.environ,{"CIP_PUBLISHABLE_KEY":"fake","CIP_ACCESS_TOKEN":"fake"}),patch.object(sys,"argv",["worker","--company","shopping_prohospital","--agent","doquita","--execute"]),patch.object(worker,"rest",return_value=[{"enabled":False}]),patch.object(worker,"request") as model:
            with self.assertRaises(ValueError):worker.main()
            self.assertFalse(model.called)
if __name__=="__main__":unittest.main()
