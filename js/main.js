/* globals requirejs */
requirejs.config({
	baseUrl: 'js',
	paths: {
		jquery: 'lib/jquery-3.3.1.min',
		dateFns: 'lib/date_fns',
		history: 'lib/history.min',
		lodash: 'lib/lodash.min',
		vhtml: 'lib/vhtml.min',
		htm: 'lib/htm.umd'
	},
	map: {
		'*': {
			jquery: 'jquery-mod'
		},
		'jquery-mod': {
			jquery: 'jquery'
		}
	}
});

requirejs.onError = function (err) {
	console.error('RequireJS module load error:', err);
	var banner = document.createElement('div');
	banner.textContent = 'Gagal memuat aplikasi chat. Periksa koneksi internet Anda, lalu muat ulang halaman.';
	banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#dc2626;color:#fff;' +
		'padding:12px 16px;font-family:sans-serif;font-size:14px;text-align:center;';
	document.body.appendChild(banner);
};

requirejs(['app']);
