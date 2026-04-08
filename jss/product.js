async function load() {
  
  await addcomp('navbar-placeholder', './comps/nav.html');
  await addcomp('searchbar-placeholder', './comps/searchbar.html');
  await searchjsfunc();
  
  await addcomp('productcomp-placeholder', './comps/productcomp.html');

  await addcomp('footer-placeholder', './comps/footer.html');

}



load()