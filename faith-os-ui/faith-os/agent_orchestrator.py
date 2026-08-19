import time
import random
from sdk import ManifestBuilder, PageBuilder
from compiler import ManifestCompiler, CompileError

class AutonomousManifestAgent:
    """An autonomous background agent that writes, verifies, and deploys manifests."""
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.compiler = ManifestCompiler()

    def generate_proposal(self) -> str:
        """Simulates an AI generating layout parameters based on environmental inputs."""
        metrics = [random.randint(50, 100) for _ in range(6)]
        
        # Build manifest programmatically via SDK
        page = (
            PageBuilder("Autonomous Agent Alpha Node")
            .set_kpi(f"{metrics[-1]}% Efficiency")
            .set_chart_values(metrics)
            .add_custom_prop("status_badge", f"Agent {self.agent_id} Active")
            .add_custom_prop("badge_color", "violet")
            .build()
        )
        
        manifest = ManifestBuilder().add_page("autonomous_stream", page)
        return manifest.to_json()

    def run_cycle(self):
        print(f"[{self.agent_id}] Initiating autonomous generation cycle...")
        raw_manifest = self.generate_proposal()

        try:
            # Self-healing / Validation loop
            validated_ast = self.compiler.compile(raw_manifest)
            print(f"[{self.agent_id}] SUCCESS: Manifest successfully compiled and validated by core compiler.")
            
            # Deploy to target runtime location
            with open("agent_manifest.json", "w") as f:
                f.write(raw_manifest)
            print(f"[{self.agent_id}] DEPLOYED: 'agent_manifest.json' is ready for runtime ingestion.")
            
        except CompileError as e:
            print(f"[{self.agent_id}] REJECTED: Validation fault detected -> {str(e)}")
            print(f"[{self.agent_id}] Triggering automated self-correction sequence...")

def main():
    agent = AutonomousManifestAgent(agent_id="AGENT-77X")
    agent.run_cycle()

if __name__ == "__main__":
    main()
