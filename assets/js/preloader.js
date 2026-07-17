const preloader = document.getElementById('preloader');

if (preloader) {
    setTimeout(() => {
        preloader.classList.add('preloader-exit');
    }, 3600);
}
