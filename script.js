const nav = Nav();
const slideShow = SlideShow();
slideShow.currentSlide(1);

function Nav() {
  let previousTab = 'home-page';

  const swapMiddle = (n) => {
    document.getElementById(previousTab).style.display = 'none';
    document.getElementById(n).style.display = 'initial';
    previousTab = n;
  }

  const showSideBar = () => {
    document.getElementById('side-nav-bar').style.display = 'flex';
    document.getElementById('filter').style.display = 'block';
  }

  const hideSideBar = () => {
    document.getElementById('side-nav-bar').style.display = 'none';
    document.getElementById('filter').style.display = 'none';
  }

  return {
    swapMiddle,
    showSideBar,
    hideSideBar
  }
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