 class GitHubReposSearch {
        constructor() {
          this.searchInput = document.getElementById("searchInput");
          this.autocompleteList = document.getElementById("autocompleteList");
          this.repositoriesList = document.getElementById("repositoriesList");
          this.addedRepos = [];
          this.debounceTimeout = null;

          this.init();
        }

        init() {
          this.searchInput.addEventListener("input", (e) => {
            this.handleSearchInput(e.target.value);
          });

          document.addEventListener("click", (e) => {
            if (
              !this.searchInput.contains(e.target) &&
              !this.autocompleteList.contains(e.target)
            ) {
              this.hideAutocomplete();
            }
          });

          this.loadFromLocalStorage();
        }

        handleSearchInput(query) {
          clearTimeout(this.debounceTimeout);

          if (!query.trim()) {
            this.hideAutocomplete();
            return;
          }

          this.debounceTimeout = setTimeout(() => {
            this.searchRepositories(query);
          }, 500);
        }

        async searchRepositories(query) {
          try {
            this.autocompleteList.innerHTML = "<div>Загрузка...</div>";
            this.showAutocomplete();

            const response = await fetch(
              `https://api.github.com/search/repositories?q=${encodeURIComponent(
                query
              )}&per_page=5`
            );

            if (!response.ok) throw new Error("Ошибка");

            const data = await response.json();
            this.displayAutocomplete(data.items);
          } catch (error) {
            this.autocompleteList.innerHTML = "<div>Ошибка</div>";
          }
        }

        displayAutocomplete(repositories) {
          if (!repositories || repositories.length === 0) {
            this.autocompleteList.innerHTML = "<div>Ничего не найдено</div>";
            return;
          }

          this.autocompleteList.innerHTML = repositories
            .map(
              (repo) => `
                    <div class="autocomplete-item" data-repo='${JSON.stringify({
                      name: repo.name,
                      owner: repo.owner.login,
                      stars: repo.stargazers_count,
                    })}'>
                        ${repo.name} (${repo.owner.login}) - ${
                repo.stargazers_count
              }
                    </div>
                `
            )
            .join("");

          this.autocompleteList
            .querySelectorAll(".autocomplete-item")
            .forEach((item) => {
              item.addEventListener("click", () => {
                const repoData = JSON.parse(item.dataset.repo);
                this.addRepository(repoData);
              });
            });

          this.showAutocomplete();
        }

        addRepository(repoData) {
          if (this.addedRepos.some((repo) => repo.name === repoData.name))
            return;

          this.addedRepos.push(repoData);
          this.renderRepositoriesList();
          this.searchInput.value = "";
          this.hideAutocomplete();
          this.saveToLocalStorage();
        }

        removeRepository(index) {
          this.addedRepos.splice(index, 1);
          this.renderRepositoriesList();
          this.saveToLocalStorage();
        }

        renderRepositoriesList() {
          this.repositoriesList.innerHTML = this.addedRepos
            .map(
              (repo, index) => `
                    <div class="repo-item">
                        ${repo.name}<br>
                        Владелец: ${repo.owner}<br>
                        Звезды: ${repo.stars}
                        <button class="remove-btn" data-index="${index}">X</button>
                    </div>
                `
            )
            .join("");

          this.repositoriesList
            .querySelectorAll(".remove-btn")
            .forEach((btn) => {
              btn.addEventListener("click", (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeRepository(index);
              });
            });
        }

        showAutocomplete() {
          this.autocompleteList.style.display = "block";
        }

        hideAutocomplete() {
          this.autocompleteList.style.display = "none";
        }

        saveToLocalStorage() {
          localStorage.setItem("githubRepos", JSON.stringify(this.addedRepos));
        }

        loadFromLocalStorage() {
          const saved = localStorage.getItem("githubRepos");
          if (saved) {
            this.addedRepos = JSON.parse(saved);
            this.renderRepositoriesList();
          }
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        new GitHubReposSearch();
      });
