export const defaultProject = {
  id: Date.now(),

  name: "Untitled Project",

  files: [
    {
      id: 1,
      name: "Main.java",
      language: "java",
      content:
`public class Main {

    public static void main(String[] args){

        System.out.println("Hello AegisCode");

    }

}`
    }
  ]
};