var previousTab = 'home-page';

const slideShow = SlideShow();
slideShow.currentSlide(1);

function swapMiddle(p, n) {
  document.getElementById(p).style.display = 'none';
  document.getElementById(n).style.display = 'initial';
  previousTab = n;
}

function showSideBar() {
  document.getElementById('side-nav-bar').style.display = 'flex';
  document.getElementById('filter').style.display = 'block';
}

function hideSideBar() {
  document.getElementById('side-nav-bar').style.display = 'none';
  document.getElementById('filter').style.display = 'none';
}

function SlideShow() {

  let slideIndex = 1;

  // Next/previous controls
  const plusSlides = (n) => {
    showSlides(slideIndex += n);
  }

  // Thumbnail image controls
  const currentSlide = (n) => {
    showSlides(slideIndex = n);
  }

  const showSlides = (n) => {
    let i;
    let slides = document.getElementsByClassName("my-slides");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) {
      slideIndex = 1;
    }
    if (n < 1) {
      slideIndex = slides.length;
    }
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
  }

  return {
    plusSlides,
    currentSlide
  }
}