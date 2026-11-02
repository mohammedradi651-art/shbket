
export async function detectDevTools() {
    (function () {
        function dev() {
            if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
                alert("نسخ الروابط غير مسموح");
                window.location.href = "about:blank";
            }
        }
        setInterval(dev, 500);
    })();
}
