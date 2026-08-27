(function() {
    var githubOwner = 'lotsacookie';
    var githubRepo = 'kstuff';
    var githubFile = 'Pages/gfn/assets/main.js';
    var u = 'https://api.github.com/repos/' + githubOwner + '/' + githubRepo + '/commits?path=' + githubFile + '&per_page=1';
    fetch(u)
        .then(function(r) { return r.json(); })
        .then(function(d) {
            if (d && d[0] && d[0].sha) {
                var s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/gh/' + githubOwner + '/' + githubRepo + '@' + d[0].sha + '/' + githubFile;
                document.body.appendChild(s);
            }
        });
})();
