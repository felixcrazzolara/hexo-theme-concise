(function () {
    var searchXmlPath = '/search.xml';
    var searchData = null;

    function fetchSearchData(callback) {
        if (searchData) { callback(searchData); return; }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', searchXmlPath, true);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(xhr.responseText, 'text/xml');
                var entries = doc.querySelectorAll('entry');
                searchData = [];
                entries.forEach(function (entry) {
                    var titleEl = entry.querySelector('title');
                    var urlEl = entry.querySelector('url');
                    var contentEl = entry.querySelector('content');
                    searchData.push({
                        title: titleEl ? titleEl.textContent : '',
                        url: urlEl ? urlEl.textContent : '',
                        content: contentEl ? contentEl.textContent : ''
                    });
                });
                callback(searchData);
            }
        };
        xhr.onerror = function () { console.error('Failed to load search.xml'); };
        xhr.send();
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlight(text, query) {
        var escaped = escapeRegex(query);
        return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
    }

    function getSnippet(content, query, radius) {
        radius = radius || 80;
        var idx = content.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return content.substring(0, radius * 2);
        var start = Math.max(0, idx - radius);
        var end = Math.min(content.length, idx + query.length + radius);
        var snippet = (start > 0 ? '...' : '') + content.substring(start, end) + (end < content.length ? '...' : '');
        return snippet;
    }

    function doSearch(query, resultEl) {
        if (!query.trim()) { resultEl.style.display = 'none'; resultEl.innerHTML = ''; return; }
        fetchSearchData(function (data) {
            var q = query.trim().toLowerCase();
            var results = data.filter(function (item) {
                return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
            }).slice(0, 8);

            if (results.length === 0) {
                resultEl.innerHTML = '<div class="local-search-empty">No results for &ldquo;' + query + '&rdquo;</div>';
            } else {
                resultEl.innerHTML = results.map(function (item) {
                    var titleHl = highlight(item.title || '(no title)', query);
                    var snippet = highlight(getSnippet(item.content, query), query);
                    return '<a class="local-search-item" href="' + item.url + '">' +
                        '<div class="local-search-title">' + titleHl + '</div>' +
                        '<div class="local-search-snippet">' + snippet + '</div>' +
                        '</a>';
                }).join('');
            }
            resultEl.style.display = 'block';
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var input = document.getElementById('local-search-input');
        var result = document.getElementById('local-search-result');
        if (!input || !result) return;

        var debounceTimer;
        input.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function () {
                doSearch(input.value, result);
            }, 200);
        });

        input.addEventListener('focus', function () {
            if (input.value.trim()) doSearch(input.value, result);
        });

        document.addEventListener('click', function (e) {
            if (!result.contains(e.target) && e.target !== input) {
                result.style.display = 'none';
            }
        });
    });
})();
