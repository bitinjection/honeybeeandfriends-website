const nav = LoggedNavigator(new Nav());
const slideShow = SlideShow();
slideShow.currentSlide(1);


// Initialize gtag
window.dataLayer = window.dataLayer || [];

function gtag() {
  dataLayer.push(arguments);
}

function logPageView(target) {
  // Quick hack since this isn't really what I'm focusing on at the moment
  // Use the element ID as a fake page
  gtag('set', 'page_path', '/' + target + '.html');
  gtag('event', 'page_view');
}

gtag('js', new Date());

gtag('config', 'UA-235385299-1');

// Initial, special page load event
logPageView('landing-page');

function LoggedNavigator(navigator) {

  const swapMiddle = (target) => {
    navigator.swapMiddle(target);
    logPageView(target)
  }

  const showSideBar = () => navigator.showSideBar();
  const hideSideBar = () => navigator.hideSideBar();

  return {
    swapMiddle,
    showSideBar,
    hideSideBar
  };
}

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




function Tests() {
  function IsGtagLoaded()
  {
    if (!gtag) {
      console.log('gtag is not loaded')
    }
  }

  function run() {
    if (location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    {
      console.log("RUNNING TESTS");
      IsGtagLoaded();
      console.log("TESTS COMPLETED")
    }
  }

  return {
    run
  }
}

const tests = Tests();

tests.run();
