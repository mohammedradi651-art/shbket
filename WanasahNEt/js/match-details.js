import { apiKey } from './api-key.js';
import { simulateLoading } from './main.js';
import { detectDevTools } from './dev-tools.js';
document.addEventListener('DOMContentLoaded', function () {
    detectDevTools();
    simulateLoading();
    load();
});
async function fetchLinks(url) {
    try {
        let proxy = "https://joaantv.com/proxy.php?url=";
        let response = await fetch(proxy + encodeURIComponent(url), {
            headers: {
                'API-KEY': apiKey(),
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        document.querySelector("#sting-web").innerHTML = `<div class="Error" style="text-align:center; padding:20px; color:red;">No matches</div>`;
        return [];
    }
}
function goToPage(value) {
    window.location.href = value
}


async function load() {
    try {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('id');
        let links = await fetchLinks(`https://api.joaantv.com/subscriptions/matches/${id}`);
        const maLinks = links.data || [];
        goToPage(maLinks[0].url);
        // document.querySelector("#sting-web").innerHTML = `<iframe src="https://joaantv.com/sub-proxy.php?url=${maLinks[0].url}" allow="encrypted-media; fullscreen"   referrerpolicy="origin-when-cross-origin" width="800" height="450" style="width:100%;height:100vh;"></iframe>`;
    } catch (error) {
        document.querySelector("#sting-web").innerHTML = `<div class="Error" style="text-align:center; padding:20px; color:red;">No matches</div>`;
        console.error('Error fetching matches:', error.message);

    }

}
