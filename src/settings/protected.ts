const routerWithAuth: string[] = ['/'];

const routerWithoutAuth: string[] = ['/sign-in'];

const protectedRouter = {
  routerWithAuth,
  routerWithoutAuth,
};

export default protectedRouter;
