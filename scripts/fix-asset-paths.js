/**
 * Rewrite relative image paths in post content to absolute paths
 * This ensures images work both on the full post page and in excerpts on the homepage
 */
hexo.extend.filter.register('after_post_render', function(data) {
  if (!data.content) return;

  // Get the post's URL path without the trailing index.html
  const postPath = data.path.replace(/index\.html$/, '');

  // Replace relative image paths with absolute paths
  // Matches: src="filename" or href="filename" where filename doesn't start with /, http, #, data:, or blob:
  data.content = data.content.replace(
    /(?:src|href)="(?!(?:https?:|\/|#|data:|blob:))([^"]+)"/g,
    (match, filename) => {
      const absolutePath = '/' + postPath + filename;
      return match.replace(filename, absolutePath);
    }
  );
});
