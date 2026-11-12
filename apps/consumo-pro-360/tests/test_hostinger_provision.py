"""No-network regression tests for Hostinger provisioning guardrails."""
import importlib.util
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch, call

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "provision_hostinger.py"
spec = importlib.util.spec_from_file_location("consumo_hostinger_provision", SCRIPT)
provision = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provision)

ENV = {
    "HOSTINGER_API_TOKEN": "test-token-only",
    "HOSTINGER_HOSTING_USERNAME": "u123456789",
}
ROOT = "/home/u123456789/domains/gritnews.com.br/public_html/consumo"


class HostingerProvisionGuards(unittest.TestCase):
    def test_no_credentials_never_calls_api(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(provision, "request") as request:
            with patch.object(sys, "argv", ["provision.py", "--apply"]):
                self.assertEqual(provision.main(), 2)
        request.assert_not_called()

    def test_existing_is_idempotent_and_never_posted(self):
        with patch.dict(os.environ, ENV, clear=True), patch.object(
            provision, "request", return_value=[{"subdomain": "consumo", "root_directory": ROOT}]
        ) as request:
            with patch.object(sys, "argv", ["provision.py", "--apply"]):
                self.assertEqual(provision.main(), 0)
        self.assertEqual(request.call_count, 1)
        self.assertEqual(request.call_args.kwargs, {})

    def test_shared_portal_root_is_refused(self):
        shared = "/home/u123456789/domains/gritnews.com.br/public_html"
        with patch.dict(os.environ, ENV, clear=True), patch.object(
            provision, "request", return_value=[{"subdomain": "consumo", "root_directory": shared}]
        ) as request:
            with patch.object(sys, "argv", ["provision.py", "--apply"]):
                self.assertEqual(provision.main(), 2)
        self.assertEqual(request.call_count, 1)

    def test_dry_run_does_not_post(self):
        with patch.dict(os.environ, ENV, clear=True), patch.object(
            provision, "request", return_value=[]
        ) as request:
            with patch.object(sys, "argv", ["provision.py"]):
                self.assertEqual(provision.main(), 0)
        self.assertEqual(request.call_count, 1)

    def test_apply_posts_only_dedicated_subdomain(self):
        with patch.dict(os.environ, ENV, clear=True), patch.object(
            provision, "request", side_effect=[
                [],
                {},
                [{"subdomain": "consumo", "root_directory": ROOT}],
            ]
        ) as request:
            with patch.object(sys, "argv", ["provision.py", "--apply"]):
                self.assertEqual(provision.main(), 0)
        self.assertEqual(request.call_count, 3)
        self.assertEqual(request.call_args_list[1].kwargs["method"], "POST")
        self.assertEqual(request.call_args_list[1].kwargs["body"], {
            "subdomain": "consumo",
            "directory": "consumo",
            "is_using_public_directory": False,
        })

    def test_root_validation_blocks_traversal(self):
        for invalid in [
            "/home/u/domains/gritnews.com.br/public_html",
            "/home/u/../gritnews.com.br/consumo",
            "",
            "public_html/consumo",
        ]:
            self.assertFalse(provision.safe_root(invalid))
        self.assertTrue(provision.safe_root(ROOT))


if __name__ == "__main__":
    unittest.main()
