(function ($) {
    "use strict";

    // Initiate the wowjs
    new WOW().init();


    // Fixed Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').addClass('shadow-sm').css('top', '0px');
        } else {
            $('.sticky-top').removeClass('shadow-sm').css('top', '-300px');
        }
    });


    // Smooth scrolling on the navbar links
    $(".navbar-nav a").on('click', function (event) {
        if (this.hash !== "") {
            event.preventDefault();
            
            $('html, body').animate({
                scrollTop: $(this.hash).offset().top - 90
            }, 1500, 'easeInOutExpo');
            
            if ($(this).parents('.navbar-nav').length) {
                $('.navbar-nav .active').removeClass('active');
                $(this).closest('a').addClass('active');
            }
        }
    });


    // Active nav link on scroll via IntersectionObserver
    (function() {
        if (!window.IntersectionObserver) return;

        var navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        if (!navLinks.length) return;
        var homeLink = document.querySelector('.navbar-nav a[href="#weddingHome"]');

        var sections = [];
        var hashToLink = {};
        navLinks.forEach(function(link) {
            var hash = link.getAttribute('href');
            if (hash && hash !== '#') {
                hashToLink[hash] = link;
                if (hash !== '#weddingHome') {
                    var el = document.querySelector(hash);
                    if (el) sections.push(el);
                }
            }
        });
        if (!sections.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    navLinks.forEach(function(l) { l.classList.remove('active'); });
                    var link = hashToLink['#' + entry.target.getAttribute('id')];
                    if (link) link.classList.add('active');
                }
            });
        }, { rootMargin: '-10% 0px -75% 0px' });

        sections.forEach(function(section) { observer.observe(section); });

        function updateHomeOnScroll() {
            if (!homeLink || !sections[0]) return;
            if (sections[0].getBoundingClientRect().top > window.innerHeight * 0.25) {
                navLinks.forEach(function(l) { l.classList.remove('active'); });
                homeLink.classList.add('active');
            }
        }
        window.addEventListener('scroll', updateHomeOnScroll, { passive: true });
        updateHomeOnScroll();
    })();


   // Back to top button
   $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
    } else {
        $('.back-to-top').fadeOut('slow');
    }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    }); 

})(jQuery);

