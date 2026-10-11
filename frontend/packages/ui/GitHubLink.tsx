import { repositoryUrl } from "../../repository.config";

export function GitHubLink() {
  return (
    <a href={repositoryUrl} target="_blank" rel="noreferrer">
      GitHub ↗
    </a>
  );
}
