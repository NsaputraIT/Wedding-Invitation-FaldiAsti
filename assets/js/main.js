console.log('main.js loaded');
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

// Wedding countdown — polls until the countdown elements exist, then starts
function startCountdown() {
    console.log('countdown initialized');
    var targetDate = new Date(2026, 7, 14, 0, 0, 0);

    function updateCountdown() {
        var now = new Date();
        var diff = targetDate - now;
        var countdownEl = document.getElementById("wedding-countdown");
        var messageEl = document.getElementById("wedding-day-message");

        // On the wedding day or after, hide countdown and show message
        if (now.toDateString() === targetDate.toDateString() || now > targetDate) {
            if (countdownEl) countdownEl.style.display = "none";
            if (messageEl) messageEl.style.display = "block";
            return;
        }

        if (diff <= 0) {
            if (countdownEl) countdownEl.style.display = "none";
            if (messageEl) messageEl.style.display = "block";
            return;
        }

        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var secs = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById("countdown-days").textContent = String(days).padStart(2, "0");
        document.getElementById("countdown-hours").textContent = String(hours).padStart(2, "0");
        document.getElementById("countdown-mins").textContent = String(mins).padStart(2, "0");
        document.getElementById("countdown-secs").textContent = String(secs).padStart(2, "0");
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

(function pollCountdown() {
    if (document.getElementById('countdown-days')) {
        startCountdown();
    } else {
        setTimeout(pollCountdown, 100);
    }
})();

