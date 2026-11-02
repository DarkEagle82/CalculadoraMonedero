{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_22
  ];
  idx = {
    extensions = [];
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev"];
          manager = "web";
        };
      };
    };
  };
}
