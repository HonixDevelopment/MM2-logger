        // --- DATA STATE ---
        const PLAYERS =["Charry", "Garry", "Avni", "Ishu"];
        let rounds = JSON.parse(localStorage.getItem("murderGames") || "[]");
        let currentScores = null;
        let currentSummary = "";

        // --- INITIALIZATION ---
        function init() {
            renderRoles();
            updateLeaderboard();
            renderHistory();
            updateUI();
        }

        function renderRoles() {
            const container = document.getElementById("roles-container");
            container.innerHTML = PLAYERS.map(p => `
                <div class="role-row">
                    <span>${p}</span>
                    <select id="role-${p}" onchange="updateUI()">
                        <option value="Innocent">Innocent</option>
                        <option value="Murderer">Murderer</option>
                        <option value="Sheriff">Sheriff</option>
                    </select>
                </div>
            `).join("");
        }

        // --- CORE LOGIC & UI UPDATER ---
        function updateUI() {
            const previewBox = document.getElementById("preview-box");
            const btnSubmit = document.getElementById("btn-submit");
            const outcomeSec = document.getElementById("outcome-container");
            
            let roles = {};
            PLAYERS.forEach(p => roles[p] = document.getElementById(`role-${p}`).value);

            let M = PLAYERS.filter(p => roles[p] === 'Murderer');
            let S = PLAYERS.filter(p => roles[p] === 'Sheriff');
            let I = PLAYERS.filter(p => roles[p] === 'Innocent');

            // Reset Sub-sections visibility
            document.getElementById("path-yes").style.display = "none";
            document.getElementById("path-no").style.display = "none";
            document.getElementById("sub-sheriff").style.display = "none";
            document.getElementById("sub-hero").style.display = "none";
            document.getElementById("s-who-survived").style.display = "none";
            document.getElementById("i-who-died").style.display = "none";
            
            currentScores = null;
            btnSubmit.disabled = true;

            // 1. Validate Roles
            if (M.length !== 1 || S.length !== 1 || I.length !== 2) {
                outcomeSec.style.display = "none";
                previewBox.className = "preview-box error";
                previewBox.innerHTML = "⚠️ Need exactly 1 Murderer, 1 Sheriff, 2 Innocents.";
                return;
            }

            outcomeSec.style.display = "block";
            previewBox.className = "preview-box";
            previewBox.innerHTML = "Select outcome...";

            // Helper to sync dropdowns
            function syncDropdown(id) {
                const el = document.getElementById(id);
                let currentVal = el.value;
                el.innerHTML = `<option value="" disabled selected>Select Player</option>` + I.map(p => `<option value="${p}">${p}</option>`).join("");
                if(I.includes(currentVal)) el.value = currentVal;
            }

            // 2. Read Outcome
            let mkilled = document.querySelector('input[name="mkilled"]:checked')?.value;
            if (!mkilled) return;

            let scores = { Charry: 0, Garry: 0, Avni: 0, Ishu: 0 };
            let canSubmit = false;

            if (mkilled === "yes") {
                document.getElementById("path-yes").style.display = "block";
                let whoKilled = document.querySelector('input[name="whoKilled"]:checked')?.value;
                if (!whoKilled) { previewBox.innerHTML = "Who killed the murderer?"; return; }

                if (whoKilled === "sheriff") {
                    document.getElementById("sub-sheriff").style.display = "block";
                    let alive = document.querySelector('input[name="s_alive"]:checked')?.value;
                    if (!alive) { previewBox.innerHTML = "How many innocents alive?"; return; }
                    alive = parseInt(alive);

                    if (alive === 1) {
                        document.getElementById("s-who-survived").style.display = "block";
                        syncDropdown("s_survived_select");
                        let survived = document.getElementById("s_survived_select").value;
                        if (!survived) { previewBox.innerHTML = "Select surviving innocent."; return; }
                        I.forEach(p => scores[p] = (p === survived) ? 1 : 0);
                    } else if (alive === 0) {
                        I.forEach(p => scores[p] = 0);
                    } else if (alive === 2) {
                        I.forEach(p => scores[p] = 1);
                    }
                    
                    let kills = 2 - alive;
                    scores[M[0]] = 1 + kills;
                    scores[S[0]] = 1 + alive;
                    currentSummary = "Sheriff Win";
                    canSubmit = true;

                } else if (whoKilled === "hero") {
                    document.getElementById("sub-hero").style.display = "block";
                    syncDropdown("h_hero_select");
                    let hero = document.getElementById("h_hero_select").value;
                    let alive = document.querySelector('input[name="h_alive"]:checked')?.value;
                    
                    if (!hero || !alive) { previewBox.innerHTML = "Select hero and alive count."; return; }
                    alive = parseInt(alive);

                    let kills = 2 - alive;
                    scores[M[0]] = 1 + kills;
                    scores[S[0]] = 1;

                    I.forEach(p => {
                        if (p === hero) scores[p] = 3;
                        else scores[p] = (alive === 2) ? 1 : 0;
                    });
                    currentSummary = "Hero Win";
                    canSubmit = true;
                }

            } else {
                document.getElementById("path-no").style.display = "block";
                let killed = document.querySelector('input[name="i_killed"]:checked')?.value;
                if (!killed) { previewBox.innerHTML = "How many innocents killed?"; return; }
                killed = parseInt(killed);
                let alive = 2 - killed;

                if (killed === 1) {
                    document.getElementById("i-who-died").style.display = "block";
                    syncDropdown("i_died_select");
                    let died = document.getElementById("i_died_select").value;
                    if (!died) { previewBox.innerHTML = "Who died?"; return; }
                    I.forEach(p => scores[p] = (p === died) ? 0 : 1);
                } else if (killed === 0) {
                    I.forEach(p => scores[p] = 1);
                } else if (killed === 2) {
                    I.forEach(p => scores[p] = 0);
                }

                scores[M[0]] = 1 + killed;
                scores[S[0]] = 1 + alive;
                currentSummary = "Murderer Win";
                canSubmit = true;
            }

            if (canSubmit) {
                currentScores = scores;
                previewBox.innerHTML = `
                    <div style="color:var(--c-yellow); margin-bottom:5px;">PREVIEW SCORES:</div>
                    ${PLAYERS.map(p => `<div>${p}: <span style="color:var(--c-green)">+${scores[p]}</span></div>`).join("")}
                `;
                btnSubmit.disabled = false;
            }
        }

        // --- SUBMIT ROUND ---
        function submitRound() {
            if (!currentScores) return;

            let roles = {};
            PLAYERS.forEach(p => roles[p] = document.getElementById(`role-${p}`).value);

            let roundData = {
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                timestamp: new Date().toISOString(),
                summary: currentSummary,
                roles: roles,
                scores: currentScores
            };

            rounds.push(roundData);
            saveData();

            // Reset Form
            document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
            document.querySelectorAll('select').forEach(el => {
                if(el.id.includes('role')) el.value = "Innocent";
                else el.value = "";
            });
            
            updateLeaderboard();
            renderHistory();
            updateUI();
        }

        // --- RENDER FUNCTIONS ---
        function updateLeaderboard() {
            let totals = { Charry: 0, Garry: 0, Avni: 0, Ishu: 0 };
            rounds.forEach(r => {
                PLAYERS.forEach(p => totals[p] += r.scores[p]);
            });

            let sorted = PLAYERS.slice().sort((a,b) => totals[b] - totals[a]);
            
            document.getElementById("lb-body").innerHTML = sorted.map(p => `
                <tr>
                    <td>${p}</td>
                    <td>${totals[p]}</td>
                </tr>
            `).join("");
        }

        function renderHistory() {
            const container = document.getElementById("history-container");
            if (rounds.length === 0) {
                container.innerHTML = "<p>No games played yet.</p>";
                return;
            }

            container.innerHTML = rounds.slice().reverse().map((r, idx) => {
                let roundNum = rounds.length - idx;
                let scoreText = PLAYERS.map(p => `${p}: +${r.scores[p]}`).join(" | ");
                return `
                    <div class="history-card">
                        <button class="hist-del" onclick="deleteRound('${r.id}')">X</button>
                        <div class="hist-title">Round #${roundNum} — ${r.summary}</div>
                        <div class="hist-scores">${scoreText}</div>
                        <div style="font-size:0.8rem; color:#888; margin-top:5px;">
                            M: ${Object.keys(r.roles).find(p=>r.roles[p]==='Murderer')} | 
                            S: ${Object.keys(r.roles).find(p=>r.roles[p]==='Sheriff')}
                        </div>
                    </div>
                `;
            }).join("");
        }

        // --- DATA MANAGEMENT ---
        function saveData() {
            localStorage.setItem("murderGames", JSON.stringify(rounds));
        }

        function deleteRound(id) {
            rounds = rounds.filter(r => r.id !== id);
            saveData();
            updateLeaderboard();
            renderHistory();
        }

        function clearAll() {
            if(confirm("Are you sure you want to delete all rounds? This resets the leaderboard completely!")) {
                rounds =[];
                saveData();
                updateLeaderboard();
                renderHistory();
            }
        }

        // --- EXPORTS ---
        function exportData(format) {
            let content, filename, mime;
            
            if (format === 'json') {
                content = JSON.stringify(rounds, null, 2);
                filename = `murder_logger_export_${new Date().getTime()}.json`;
                mime = "application/json";
            } else if (format === 'csv') {
                let totals = { Charry: 0, Garry: 0, Avni: 0, Ishu: 0 };
                rounds.forEach(r => PLAYERS.forEach(p => totals[p] += r.scores[p]));
                let sorted = PLAYERS.slice().sort((a,b) => totals[b] - totals[a]);
                
                content = "Player,Total Points\n";
                sorted.forEach(p => content += `${p},${totals[p]}\n`);
                filename = `murder_leaderboard_${new Date().getTime()}.csv`;
                mime = "text/csv";
            }

            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }

        // Start App
        init();