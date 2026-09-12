export const injectResponsiveCSS = (html) => {
  if (!html) return html;
  const injection = `
    <script>
      window.addEventListener('error', function(e) {
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#fee2e2;color:#991b1b;padding:10px;font-family:sans-serif;font-size:12px;z-index:9999;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);';
        errDiv.innerHTML = '<strong>Simulation Code Error:</strong> ' + e.message;
        document.body.appendChild(errDiv);
      });

      (function() {
        // Remove any forced zoom/transform from AI-generated scripts
        function resetZoom() {
          document.body.style.zoom = '1';
          document.body.style.transform = 'none';
        }

        var lastHeight = 0;
        function reportHeight() {
          resetZoom();
          var h = Math.max(
            document.body.scrollHeight || 0,
            document.documentElement.scrollHeight || 0
          );
          if (h !== lastHeight && h > 0) {
            lastHeight = h;
            window.parent.postMessage({ type: 'sim-content-height', height: h }, '*');
          }
        }

        // Report on DOMContentLoaded
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            reportHeight();
            setTimeout(reportHeight, 100);
            setTimeout(reportHeight, 500);
            setTimeout(reportHeight, 1500);
          });
        } else {
          reportHeight();
          setTimeout(reportHeight, 100);
          setTimeout(reportHeight, 500);
          setTimeout(reportHeight, 1500);
        }

        // Report on resize
        window.addEventListener('resize', reportHeight);

        // Report on DOM mutations (dynamic content, canvas init, etc.)
        if (typeof MutationObserver !== 'undefined') {
          var observer = new MutationObserver(function() {
            setTimeout(reportHeight, 50);
          });
          var startObserver = function() {
            observer.observe(document.body, {
              childList: true, subtree: true, attributes: true
            });
          };
          if (document.body) {
            startObserver();
          } else {
            document.addEventListener('DOMContentLoaded', startObserver);
          }
        }
      })();
    </script>
  `;
  if (html.includes('</head>')) {
    return html.replace('</head>', injection + '</head>');
  }
  return html + injection;
};
