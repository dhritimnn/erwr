async function load() {
  
  await addcomp('navbar-placeholder', './comps/nav.html');
  await addcomp('searchbar-placeholder', './comps/searchbar.html');
  
  await searchjsfunc();
  
  await addcomp('wishlistcomp-placeholder', './comps/wishlistcomp.html');
  await wishlistInit();

}



load()