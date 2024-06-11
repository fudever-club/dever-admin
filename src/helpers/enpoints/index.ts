const prefixAuth: string = "/core";
const prefixBase: string = "/api/v1";
const prefixOther: string = "/api/core";

const prefixApiAuth: string = `/api/core`;

const endpointAuth = {
  SIGN_IN: `${prefixBase}/auth/login/`,
  SIGN_UP: `${prefixBase}/auth/register/`,
  VERIFY_TOKEN: `${prefixBase}/verifyToken`,
};

const endpointUsersManagement = {
  GET_ALL_USERS: `${prefixBase}/users/`,
  DELETE_USER: `${prefixBase}/users/{id}`,
  EDIT_USER_BY_ID: `${prefixBase}/users/{id}`,
  CREATE_USERS_BY_CSV: `${prefixBase}/users/csv`,
  RESET_PASSWORD: `${prefixBase}/users/reset-password/{id}`,
};
const endpointDepartmentManagement = {
  GET_ALL_DEPARTMENTS: `${prefixBase}/department/`,
  DEPARTMENT: `${prefixBase}/department/`,
  DELETE_DEPARTMENT: `${prefixBase}/department/{id}`,
  GET_DEPARTMENT_BY_ID: `${prefixBase}/department/{id}`,
  EDIT_DEPARTMENT_BY_ID: `${prefixBase}/department/{id}`,
};
const endpointPositionManagement = {
  GET_ALL_POSITION: `${prefixBase}/position/`,
  POSITION: `${prefixBase}/position/`,
  DELETE_POSITION: `${prefixBase}/position/{id}`,
  GET_POSITION_BY_ID: `${prefixBase}/position/{id}`,
  EDIT_POSITION_BY_ID: `${prefixBase}/position/{id}`,
};
const endpointMajorManagement = {
  GET_ALL_MAJOR: `${prefixBase}/major/`,
  MAJOR: `${prefixBase}/major/`,
  DELETE_MAJOR: `${prefixBase}/major/{id}`,
  GET_MAJOR_BY_ID: `${prefixBase}/major/{id}`,
  EDIT_MAJOR_BY_ID: `${prefixBase}/major/{id}`,
};
const endpointSocialManagement = {
  GET_ALL_SOCIAL: `${prefixBase}/social/`,
  SOCIAL: `${prefixBase}/social/`,
  DELETE_SOCIAL: `${prefixBase}/social/{id}`,
  GET_SOCIAL_BY_ID: `${prefixBase}/social/{id}`,
  EDIT_SOCIAL_BY_ID: `${prefixBase}/social/{id}`,
};
const endpointImageActivityManagement = {
  GET_ALL_IMAGES: `${prefixBase}/image-activity`,
  DELETE_IMAGE: `${prefixBase}/image-activity/{id}`,
  DELETE_MANY_IMAGE: `${prefixBase}/image-activity/`,
  IMAGE: `${prefixBase}/image-activity`,
};
const endpointProjectManagement = {
  GET_ALL_PROJECT: `${prefixBase}/project`,
  DELETE_PROJECT: `${prefixBase}/project/{id}`,
  GET_PROJECT_DETAIL: `${prefixBase}/project/{id}`,
  EDIT_PROJECT: `${prefixBase}/project/{id}`,
  PROJECT: `${prefixBase}/project`,
};
const endpointAlbumManagement = {
  GET_ALL_Album: `${prefixBase}/album`,
  DELETE_ALBUM: `${prefixBase}/album/{id}`,
  GET_ALBUM_DETAIL: `${prefixBase}/album/{id}`,
  EDIT_ALBUM: `${prefixBase}/album/{id}`,
  ALBUM: `${prefixBase}/album`,
  DELETE_MANY_IMAGES_IN_ALBUM: `${prefixBase}/album/{slug}/delete-images`,
  UPLOAD_IMAGES_FOR_ALBUM: `${prefixBase}/album/{slug}`,
};

const endpointOther = {};

export {
  endpointAlbumManagement,
  endpointAuth,
  endpointUsersManagement,
  endpointDepartmentManagement,
  endpointOther,
  endpointPositionManagement,
  endpointMajorManagement,
  endpointSocialManagement,
  endpointImageActivityManagement,
  endpointProjectManagement,
};
