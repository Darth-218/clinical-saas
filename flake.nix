{
  description = "Development environment for clinical-saas";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: 
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs_22
          pnpm
          docker-compose
          openssl
          prisma-engines
        ];

        shellHook = ''
          # Bind Prisma engines to native NixOS binaries
          export PRISMA_QUERY_ENGINE_BINARY="${pkgs.prisma-engines}/bin/query-engine"
          export PRISMA_QUERY_ENGINE_LIBRARY="${pkgs.prisma-engines}/lib/libquery_engine.node"
          export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
          
          echo "Environment initialized for clinical-saas."
          echo "Node.js: $(node --version)"
          echo "pnpm: $(pnpm --version)"
        '';
      };
    };
}
